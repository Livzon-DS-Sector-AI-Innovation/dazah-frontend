'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  App,
  Card, 
  Button, 
  Upload, 
  Tabs, 
  Table, 
  Tag, 
  Descriptions,
  Alert,
  Space,
  Typography,
  Select,
  Modal,
  Form,
  Input,
  Popconfirm
} from 'antd'
import { 
  UploadOutlined, 
  DownloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'

const { Text } = Typography
const { Option } = Select

interface ElementResult {
  symbol: string
  source: string
  intentionally_added: boolean
  assessment_required: boolean
  q3d_class: string
  oral_pde?: number
  parenteral_pde?: number
  inhalation_pde?: number
  cutaneous_pde?: number
  ctcl?: number
  oral_assess: boolean
  parenteral_assess: boolean
  inhalation_assess: boolean
  cutaneous_assess: boolean
  notes: string
  found_in_text?: boolean
  needs_assessment?: boolean
  pde_for_route?: number
  control_threshold?: number
  ctcl_applicable?: boolean
}

interface SolventResult {
  name_en: string
  name_cn: string
  class: string
  limit_ppm?: number
  pde_mg_day?: number
  found_in_text: boolean
}

interface Q3DResult {
  type: 'Q3D'
  text_length: number
  steps_count: number
  elements_found: ElementResult[]
  total_elements: number
  needs_assessment: number
  summary: {
    class_1: number
    class_2a: number
    class_2b: number
    class_3: number
    other: number
  }
  report: string
  llm_used?: boolean
  llm_elements_count?: number
}

interface Q3CResult {
  type: 'Q3C'
  text_length: number
  steps_count: number
  solvents_found: SolventResult[]
  total_solvents: number
  summary: {
    class_1: number
    class_2: number
    class_3: number
    unknown: number
  }
  report: string
  llm_used?: boolean
  llm_solvents_count?: number
}

interface CombinedResult {
  id?: string
  q3d: Q3DResult
  q3c: Q3CResult
}

interface HistoryRecord {
  id: string
  filename: string
  llm_used: boolean
  q3c_total: number
  q3d_total: number
  q3d_needs_assessment: number
  created_at: string
}

export function ICHAnalysisPage() {
  const [result, setResult] = useState<CombinedResult | null>(null)
  const [loading, setLoading] = useState(false)

  // History
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyLoading, setHistoryLoading] = useState(false)

  // LLM config
  const [llmConfigOpen, setLlmConfigOpen] = useState(false)
  const [llmConfig, setLlmConfig] = useState({ api_key: '', base_url: '', model: '', is_configured: false })
  const [llmTestResult, setLlmTestResult] = useState<{success: boolean, message: string} | null>(null)
  const [llmTesting, setLlmTesting] = useState(false)
  const [llmForm] = Form.useForm()

  const { message } = App.useApp()

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  // Load history
  const loadHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/research/ich/records?page=${page}&page_size=10`)
      const data = await res.json()
      if (data.code === 200) {
        setHistory(data.data || [])
        setHistoryTotal(data.meta?.total || 0)
        setHistoryPage(page)
      }
    } catch (error) {
      console.error('加载分析历史失败', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [API_BASE])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Upload + analyze
  const handleUpload = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/api/v1/research/ich/analyze?use_llm=true`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: '分析失败' }))
        throw new Error(error.message || '分析失败')
      }

      const data = await res.json()
      setResult(data.data)
      message.success('ICH Q3C/Q3D 分析完成，已保存')
      loadHistory(historyPage)
    } catch (error: any) {
      message.error(error.message || '分析失败')
    } finally {
      setLoading(false)
    }
    return false
  }

  // View a history record
  const viewRecord = async (recordId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/research/ich/records/${recordId}`)
      const data = await res.json()
      if (data.code === 200) {
        setResult({
          id: data.data.id,
          q3d: data.data.q3d,
          q3c: data.data.q3c,
        })
      }
    } catch (error) {
      message.error('加载记录失败')
    } finally {
      setLoading(false)
    }
  }

  // Delete a history record
  const deleteRecord = async (recordId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/research/ich/records/${recordId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 200) {
        message.success('记录已删除')
        if (result?.id === recordId) setResult(null)
        loadHistory(historyPage)
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  // Download report
  const downloadReport = (report: string, filename: string) => {
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // LLM config handlers
  const loadLlmConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/research/llm/config`)
      const data = await res.json()
      if (data.code === 200) {
        setLlmConfig(data.data)
        llmForm.setFieldsValue({
          api_key: '',  // Don't pre-fill masked key
          base_url: data.data.base_url,
          model: data.data.model,
        })
      }
    } catch (error) {
      console.error('加载 LLM 配置失败', error)
    }
  }

  const saveLlmConfig = async () => {
    try {
      const values = await llmForm.validateFields()
      const res = await fetch(`${API_BASE}/api/v1/research/llm/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (data.code === 200) {
        message.success('配置已保存')
        setLlmConfig(data.data)
        setLlmConfigOpen(false)
      }
    } catch (error) {
      message.error('保存失败')
    }
  }

  const testLlmConnection = async () => {
    setLlmTesting(true)
    setLlmTestResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/research/llm/test`, { method: 'POST' })
      const data = await res.json()
      setLlmTestResult({ success: data.code === 200, message: data.message || data.data?.message || '测试完成' })
    } catch (error) {
      setLlmTestResult({ success: false, message: '连接失败' })
    } finally {
      setLlmTesting(false)
    }
  }

  // Table columns
  const q3dColumns = [
    { title: '元素', dataIndex: 'symbol', key: 'symbol', width: 80, fixed: 'left' as const },
    {
      title: '分类', dataIndex: 'q3d_class', key: 'q3d_class', width: 100,
      render: (cls: string) => {
        const colors: Record<string, string> = { 'Class 1': 'red', 'Class 2A': 'orange', 'Class 2B': 'gold', 'Class 3': 'green' }
        return <Tag color={colors[cls] || 'default'}>{cls}</Tag>
      },
    },
    { title: '来源', dataIndex: 'source', key: 'source', width: 200 },
    { title: '有意添加', dataIndex: 'intentionally_added', key: 'intentionally_added', width: 100, render: (val: boolean) => val ? <Tag color="blue">是</Tag> : <Tag>否</Tag> },
    { title: '文中发现', dataIndex: 'found_in_text', key: 'found_in_text', width: 100, render: (val: boolean) => val ? <Tag color="success">✓</Tag> : <Tag>-</Tag> },
    { title: '需评估', dataIndex: 'needs_assessment', key: 'needs_assessment', width: 100, render: (val: boolean) => val ? <Tag color="warning">需要</Tag> : <Tag color="success">无需</Tag> },
    { title: '备注', dataIndex: 'notes', key: 'notes', width: 200 },
  ]

  const q3cColumns = [
    {
      title: '溶剂名称', key: 'name', width: 200,
      render: (_: any, record: SolventResult) => (
        <div><div>{record.name_cn}</div><div style={{ fontSize: 12, color: '#999' }}>{record.name_en}</div></div>
      ),
    },
    {
      title: '分类', dataIndex: 'class', key: 'class', width: 100,
      render: (cls: string) => {
        const colors: Record<string, string> = { 'Class 1': 'red', 'Class 2': 'orange', 'Class 3': 'green' }
        return <Tag color={colors[cls] || 'default'}>{cls}</Tag>
      },
    },
    { title: 'PDE (mg/天)', dataIndex: 'pde_mg_day', key: 'pde_mg_day', width: 120, render: (val: any) => { if (typeof val === 'number') return val.toFixed(2); if (val != null && !isNaN(Number(val))) return Number(val).toFixed(2); return '-'; } },
    { title: '限度 (ppm)', dataIndex: 'limit_ppm', key: 'limit_ppm', width: 120, render: (val: any) => { if (typeof val === 'number') return val.toFixed(0); if (val != null && !isNaN(Number(val))) return Number(val).toFixed(0); return '-'; } },
    { title: '文中发现', dataIndex: 'found_in_text', key: 'found_in_text', width: 100, render: (val: boolean) => val ? <Tag color="success">✓</Tag> : <Tag>-</Tag> },
  ]

  const historyColumns = [
    { title: '文件名', dataIndex: 'filename', key: 'filename', ellipsis: true },
    { title: 'Q3D 元素', dataIndex: 'q3d_total', key: 'q3d_total', width: 100 },
    { title: '需评估', dataIndex: 'q3d_needs_assessment', key: 'q3d_needs_assessment', width: 90, render: (v: number) => v > 0 ? <Tag color="warning">{v}</Tag> : <Tag color="success">0</Tag> },
    { title: 'Q3C 溶剂', dataIndex: 'q3c_total', key: 'q3c_total', width: 100 },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 170, render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, record: HistoryRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewRecord(record.id)}>查看</Button>
          <Popconfirm title="确定删除此记录？" onConfirm={() => deleteRecord(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>ICH Q3C/Q3D 杂质识别</h1>
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => { setLlmConfigOpen(true); loadLlmConfig() }}>AI 配置</Button>
        </Space>
      </div>

      {/* Upload section */}
      <Card style={{ marginBottom: 16 }}>
        <Upload accept=".docx" beforeUpload={handleUpload} showUploadList={false} disabled={loading}>
          <Button icon={<UploadOutlined />} size="large" loading={loading} style={{ width: '100%', height: 40 }}>
            {loading ? '分析中...' : '上传 DOCX 文件进行分析'}
          </Button>
        </Upload>
        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 13 }}>
          支持 .docx 格式，将同时进行 Q3C（溶剂残留）和 Q3D（元素杂质）分析，结果自动保存
        </Text>
      </Card>

      {/* Analysis results */}
      {result && (
        <Card title={result.id ? `分析结果（来自历史记录）` : '分析结果'} style={{ marginBottom: 16 }}>
          <Tabs
            defaultActiveKey="q3d"
            items={[
              {
                key: 'q3d',
                label: `Q3D 元素杂质 (${result.q3d.total_elements} 个)`,
                children: (
                  <div>
                    <Alert
                      title="评估说明"
                      description={`共发现 ${result.q3d.total_elements} 个元素，其中 ${result.q3d.needs_assessment} 个需要进一步评估。评估所有给药途径（口服、注射、吸入、皮肤）。`}
                      type="info" showIcon style={{ marginBottom: 16 }}
                    />
                    <Descriptions bordered size="small" column={4} style={{ marginBottom: 16 }}>
                      <Descriptions.Item label="Class 1 元素（高毒）"><Tag color="red">{result.q3d.summary.class_1} 个</Tag></Descriptions.Item>
                      <Descriptions.Item label="Class 2A 元素"><Tag color="orange">{result.q3d.summary.class_2a} 个</Tag></Descriptions.Item>
                      <Descriptions.Item label="Class 2B 元素"><Tag color="gold">{result.q3d.summary.class_2b} 个</Tag></Descriptions.Item>
                      <Descriptions.Item label="Class 3 元素"><Tag color="green">{result.q3d.summary.class_3} 个</Tag></Descriptions.Item>
                    </Descriptions>
                    <Table columns={q3dColumns} dataSource={result.q3d.elements_found} rowKey="symbol" pagination={false} scroll={{ x: 1000 }} size="small" />
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Button icon={<DownloadOutlined />} onClick={() => downloadReport(result.q3d.report, 'ICH_Q3D_Report.md')}>下载 Q3D 报告</Button>
                    </div>
                  </div>
                ),
              },
              {
                key: 'q3c',
                label: `Q3C 溶剂残留 (${result.q3c.total_solvents} 个)`,
                children: (
                  <div>
                    <Alert
                      title="评估说明"
                      description={`共发现 ${result.q3c.total_solvents} 种溶剂。`}
                      type="info" showIcon style={{ marginBottom: 16 }}
                    />
                    <Descriptions bordered size="small" column={4} style={{ marginBottom: 16 }}>
                      <Descriptions.Item label="Class 1 溶剂（应避免）"><Tag color="red">{result.q3c.summary.class_1} 个</Tag></Descriptions.Item>
                      <Descriptions.Item label="Class 2 溶剂（限制使用）"><Tag color="orange">{result.q3c.summary.class_2} 个</Tag></Descriptions.Item>
                      <Descriptions.Item label="Class 3 溶剂（低毒）"><Tag color="green">{result.q3c.summary.class_3} 个</Tag></Descriptions.Item>
                    </Descriptions>
                    <Table columns={q3cColumns} dataSource={result.q3c.solvents_found} rowKey="name_en" pagination={false} scroll={{ x: 800 }} size="small" />
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Button icon={<DownloadOutlined />} onClick={() => downloadReport(result.q3c.report, 'ICH_Q3C_Report.md')}>下载 Q3C 报告</Button>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* History */}
      <Card title={<span><HistoryOutlined /> 分析历史</span>}>
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          loading={historyLoading}
          size="small"
          pagination={{
            current: historyPage,
            pageSize: 10,
            total: historyTotal,
            onChange: (page) => loadHistory(page),
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* LLM config modal */}
      <Modal
        title="AI 增强识别配置"
        open={llmConfigOpen}
        onCancel={() => { setLlmConfigOpen(false); setLlmTestResult(null) }}
        footer={[
          <Button key="cancel" onClick={() => setLlmConfigOpen(false)}>取消</Button>,
          <Button key="test" onClick={testLlmConnection} loading={llmTesting}>测试连接</Button>,
          <Button key="save" type="primary" onClick={saveLlmConfig}>保存</Button>,
        ]}
        width={500}
      >
        <Form form={llmForm} layout="vertical">
          <Form.Item name="api_key" label="API Key" rules={[{ required: true, message: '请输入 API Key' }]}>
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item name="base_url" label="API Base URL" rules={[{ required: true, message: '请输入 Base URL' }]}>
            <Input placeholder="https://api.deepseek.com/v1" />
          </Form.Item>
          <Form.Item name="model" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
            <Input placeholder="deepseek-v4-flash" />
          </Form.Item>
        </Form>
        {llmConfig.is_configured && (
          <Alert
            title="当前已配置"
            description={`API Key: ${llmConfig.api_key} | 模型: ${llmConfig.model}`}
            type="success" showIcon style={{ marginBottom: 12 }}
          />
        )}
        {llmTestResult && (
          <Alert
            title={llmTestResult.success ? '✓ 连接成功' : '✗ 连接失败'}
            description={llmTestResult.message}
            type={llmTestResult.success ? 'success' : 'error'} showIcon
            icon={llmTestResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>
    </div>
  )
}
