'use client'

import { useState } from 'react'
import { 
  Card, 
  Button, 
  Upload, 
  message, 
  Tabs, 
  Table, 
  Tag, 
  Descriptions,
  Alert,
  Space,
  Typography,
  Divider,
  Select,
  Radio,
  Checkbox,
  Modal,
  Form,
  Input
} from 'antd'
import { 
  UploadOutlined, 
  FileTextOutlined,
  ExperimentOutlined,
  DownloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
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
  route: string
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

export function ICHAnalysisPage() {
  const [activeTab, setActiveTab] = useState<string>('q3d')
  const [q3dResult, setQ3dResult] = useState<Q3DResult | null>(null)
  const [q3cResult, setQ3cResult] = useState<Q3CResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [route, setRoute] = useState<string>('oral')
  const [showReport, setShowReport] = useState(false)
  const [useLLM, setUseLLM] = useState(false)
  const [llmConfigOpen, setLlmConfigOpen] = useState(false)
  const [llmConfig, setLlmConfig] = useState({ api_key: '', base_url: '', model: '', is_configured: false })
  const [llmTestResult, setLlmTestResult] = useState<{success: boolean, message: string} | null>(null)
  const [llmTesting, setLlmTesting] = useState(false)
  const [llmForm] = Form.useForm()

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

  // ICH Q3D 分析
  const handleQ3DUpload = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`${API_BASE}/research/ich/q3d/analyze?route=${route}&use_llm=${useLLM}`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: '分析失败' }))
        throw new Error(error.message || '分析失败')
      }
      
      const data = await res.json()
      setQ3dResult(data.data)
      setShowReport(false)
      message.success('ICH Q3D 分析完成')
    } catch (error: any) {
      message.error(error.message || '分析失败')
    } finally {
      setLoading(false)
    }
    return false
  }

  // ICH Q3C 分析
  const handleQ3CUpload = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`${API_BASE}/research/ich/q3c/analyze?use_llm=${useLLM}`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: '分析失败' }))
        throw new Error(error.message || '分析失败')
      }
      
      const data = await res.json()
      setQ3cResult(data.data)
      setShowReport(false)
      message.success('ICH Q3C 分析完成')
    } catch (error: any) {
      message.error(error.message || '分析失败')
    } finally {
      setLoading(false)
    }
    return false
  }

  // 下载报告
  const downloadReport = (report: string, filename: string) => {
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // 加载 LLM 配置
  const loadLlmConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/research/llm/config`)
      const data = await res.json()
      if (data.code === 200) {
        setLlmConfig(data.data)
        llmForm.setFieldsValue({
          api_key: data.data.api_key,
          base_url: data.data.base_url,
          model: data.data.model,
        })
      }
    } catch (e) {
      console.error('加载 LLM 配置失败:', e)
    }
  }

  // 保存 LLM 配置
  const saveLlmConfig = async () => {
    try {
      const values = await llmForm.validateFields()
      const res = await fetch(`${API_BASE}/research/llm/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (data.code === 200) {
        setLlmConfig(data.data)
        message.success('配置已保存')
        setLlmConfigOpen(false)
      } else {
        message.error(data.message || '保存失败')
      }
    } catch (e) {
      message.error('保存失败')
    }
  }

  // 测试 LLM 连接
  const testLlmConnection = async () => {
    setLlmTesting(true)
    setLlmTestResult(null)
    try {
      const res = await fetch(`${API_BASE}/research/llm/test`, { method: 'POST' })
      const data = await res.json()
      if (data.code === 200) {
        setLlmTestResult(data.data)
      } else {
        setLlmTestResult({ success: false, message: data.message || '连接失败' })
      }
    } catch (e) {
      setLlmTestResult({ success: false, message: '连接失败' })
    } finally {
      setLlmTesting(false)
    }
  }

  // 元素杂质表格列
  const elementColumns = [
    {
      title: '元素符号',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: 'Q3D 分类',
      dataIndex: 'q3d_class',
      key: 'q3d_class',
      width: 100,
      render: (cls: string) => {
        const colors: Record<string, string> = {
          'Class 1': 'red',
          'Class 2A': 'orange',
          'Class 2B': 'gold',
          'Class 3': 'blue',
          'Other': 'default',
        }
        return <Tag color={colors[cls] || 'default'}>{cls}</Tag>
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 180,
      ellipsis: true,
    },
    {
      title: '有意添加',
      dataIndex: 'intentionally_added',
      key: 'intentionally_added',
      width: 90,
      render: (v: boolean) => v ? <Tag color="red">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: 'PDE (μg/天)',
      dataIndex: 'pde_for_route',
      key: 'pde_for_route',
      width: 120,
      render: (v: number) => v ?? '-',
    },
    {
      title: '控制阈值 (μg/天)',
      dataIndex: 'control_threshold',
      key: 'control_threshold',
      width: 140,
      render: (v: number) => v ? v.toFixed(1) : '-',
    },
    {
      title: 'CTCL (μg/g)',
      dataIndex: 'ctcl',
      key: 'ctcl',
      width: 100,
      render: (v: number, record: ElementResult) => record.ctcl_applicable ? (v ?? '-') : '-',
    },
    {
      title: '需要评估',
      key: 'needs_assessment',
      width: 100,
      render: (_: any, record: ElementResult) => 
        record.needs_assessment ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>,
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
  ]

  // 溶剂残留表格列
  const solventColumns = [
    {
      title: '溶剂名称（中文）',
      dataIndex: 'name_cn',
      key: 'name_cn',
      width: 150,
    },
    {
      title: '溶剂名称（英文）',
      dataIndex: 'name_en',
      key: 'name_en',
      width: 200,
    },
    {
      title: 'Q3C 分类',
      dataIndex: 'class',
      key: 'class',
      width: 120,
      render: (cls: string) => {
        const colors: Record<string, string> = {
          'Class 1': 'red',
          'Class 2': 'orange',
          'Class 3': 'green',
          'unknown': 'default',
        }
        return <Tag color={colors[cls] || 'default'}>{cls || '未分类'}</Tag>
      },
    },
    {
      title: '限度 (ppm)',
      dataIndex: 'limit_ppm',
      key: 'limit_ppm',
      width: 120,
      render: (v: number) => v ?? '-',
    },
    {
      title: 'PDE (mg/天)',
      dataIndex: 'pde_mg_day',
      key: 'pde_mg_day',
      width: 120,
      render: (v: number) => v ?? '-',
    },
  ]

  const routeOptions = [
    { label: '口服', value: 'oral' },
    { label: '注射', value: 'parenteral' },
    { label: '吸入', value: 'inhalation' },
    { label: '皮肤', value: 'cutaneous' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <ExperimentOutlined /> ICH Q3C、Q3D 杂质识别
        </Title>
        <Button 
          icon={<SettingOutlined />}
          onClick={() => { loadLlmConfig(); setLlmConfigOpen(true) }}
        >
          AI 配置
        </Button>
      </div>
      
      <Alert
        message="ICH 杂质识别工具"
        description="上传药品合成工艺文件（DOCX格式），自动识别元素杂质（Q3D）和溶剂残留（Q3C），并根据 ICH 指南进行分类和评估建议。支持浓度前缀识别（如95%乙醇→乙醇）。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'q3d',
            label: (
              <span>
                <ExperimentOutlined />
                ICH Q3D 元素杂质
              </span>
            ),
            children: (
              <div>
                <Card title="上传工艺文件" style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>给药途径：</Text>
                      <Radio.Group 
                        value={route} 
                        onChange={(e) => setRoute(e.target.value)}
                        style={{ marginLeft: 16 }}
                      >
                        {routeOptions.map(opt => (
                          <Radio.Button key={opt.value} value={opt.value}>{opt.label}</Radio.Button>
                        ))}
                      </Radio.Group>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <Checkbox 
                        checked={useLLM} 
                        onChange={(e) => setUseLLM(e.target.checked)}
                      >
                        使用 AI 增强识别（需要配置 OPENAI_API_KEY）
                      </Checkbox>
                    </div>
                    <Upload
                      accept=".docx"
                      maxCount={1}
                      beforeUpload={handleQ3DUpload}
                      showUploadList={false}
                    >
                      <Button icon={<UploadOutlined />} loading={loading}>
                        选择 DOCX 文件并分析
                      </Button>
                    </Upload>
                  </Space>
                </Card>

                {q3dResult && (
                  <>
                    <Card title="分析结果概览" style={{ marginBottom: 16 }}>
                      <Descriptions bordered column={2}>
                        <Descriptions.Item label="文本长度">
                          {q3dResult.text_length} 字符
                        </Descriptions.Item>
                        <Descriptions.Item label="工艺步骤数">
                          {q3dResult.steps_count} 步
                        </Descriptions.Item>
                        <Descriptions.Item label="给药途径">
                          {routeOptions.find(r => r.value === q3dResult.route)?.label || q3dResult.route}
                        </Descriptions.Item>
                        <Descriptions.Item label="识别元素总数">
                          {q3dResult.total_elements} 个
                        </Descriptions.Item>
                        <Descriptions.Item label="需要评估的元素">
                          <Tag color="red">{q3dResult.needs_assessment} 个</Tag>
                        </Descriptions.Item>
                        {q3dResult.llm_used && (
                          <Descriptions.Item label="AI 识别元素">
                            <Tag color="purple">{q3dResult.llm_elements_count} 个</Tag>
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Class 1 元素">
                          <Tag color="red">{q3dResult.summary.class_1} 个</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Class 2A 元素">
                          <Tag color="orange">{q3dResult.summary.class_2a} 个</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Class 2B 元素">
                          <Tag color="gold">{q3dResult.summary.class_2b} 个</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Class 3 元素">
                          <Tag color="blue">{q3dResult.summary.class_3} 个</Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    <Card 
                      title="元素杂质详细列表"
                      extra={
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadReport(q3dResult.report, 'ICH_Q3D_Report.md')}
                        >
                          下载报告
                        </Button>
                      }
                    >
                      <Alert
                        message="评估说明"
                        description={
                          <div>
                            <div><strong>Class 1</strong>：人体毒性与环保关注元素，所有途径必须评估</div>
                            <div><strong>Class 2A</strong>：出现概率高，需评估所有潜在来源</div>
                            <div><strong>Class 2B</strong>：出现概率较低，除非有意添加，否则可排除</div>
                            <div><strong>Class 3</strong>：口服毒性低，除非有意添加否则口服无需评估</div>
                            <div style={{ marginTop: 8 }}><strong>控制阈值</strong> = 30% PDE，低于此值通常无需额外控制</div>
                            <div><strong>CTCL</strong>：皮肤毒性浓度限度（Ni、Co 为 35 μg/g）</div>
                          </div>
                        }
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      <Table
                        columns={elementColumns}
                        dataSource={q3dResult.elements_found}
                        rowKey="symbol"
                        pagination={false}
                        scroll={{ x: 1200 }}
                        size="small"
                      />
                    </Card>

                    {showReport && (
                      <Card title="合规报告" style={{ marginTop: 16 }}>
                        <pre style={{ 
                          whiteSpace: 'pre-wrap', 
                          fontFamily: 'monospace',
                          background: '#f5f5f5',
                          padding: 16,
                          borderRadius: 4,
                          maxHeight: 500,
                          overflow: 'auto'
                        }}>
                          {q3dResult.report}
                        </pre>
                      </Card>
                    )}
                    
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Button onClick={() => setShowReport(!showReport)}>
                        {showReport ? '隐藏报告' : '查看合规报告'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ),
          },
          {
            key: 'q3c',
            label: (
              <span>
                <FileTextOutlined />
                ICH Q3C 溶剂残留
              </span>
            ),
            children: (
              <div>
                <Card title="上传工艺文件" style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <Checkbox 
                      checked={useLLM} 
                      onChange={(e) => setUseLLM(e.target.checked)}
                    >
                      使用 AI 增强识别（需要配置 OPENAI_API_KEY）
                    </Checkbox>
                  </div>
                  <Upload
                    accept=".docx"
                    maxCount={1}
                    beforeUpload={handleQ3CUpload}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} loading={loading}>
                      选择 DOCX 文件并分析
                    </Button>
                  </Upload>
                  <Alert
                    message="支持的文件格式"
                    description="仅支持 Microsoft Word DOCX 格式文件（.docx）。支持浓度前缀识别（如95%乙醇→乙醇）。"
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                </Card>

                {q3cResult && (
                  <>
                    <Card title="分析结果概览" style={{ marginBottom: 16 }}>
                      <Descriptions bordered column={2}>
                        <Descriptions.Item label="文本长度">
                          {q3cResult.text_length} 字符
                        </Descriptions.Item>
                        <Descriptions.Item label="工艺步骤数">
                          {q3cResult.steps_count} 步
                        </Descriptions.Item>
                        <Descriptions.Item label="识别溶剂总数">
                          {q3cResult.total_solvents} 个
                        </Descriptions.Item>
                        {q3cResult.llm_used && (
                          <Descriptions.Item label="AI 识别溶剂">
                            <Tag color="purple">{q3cResult.llm_solvents_count} 个</Tag>
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Class 1 溶剂（避免使用）">
                          <Tag color="red">{q3cResult.summary.class_1} 个</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Class 2 溶剂（限制使用）">
                          <Tag color="orange">{q3cResult.summary.class_2} 个</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Class 3 溶剂（低毒）">
                          <Tag color="green">{q3cResult.summary.class_3} 个</Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    <Card 
                      title="溶剂残留详细列表"
                      extra={
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadReport(q3cResult.report, 'ICH_Q3C_Report.md')}
                        >
                          下载报告
                        </Button>
                      }
                    >
                      <Alert
                        message="分类说明"
                        description={
                          <div>
                            <div><strong>Class 1</strong>：致癌物、疑似致癌物、环境危害物 — 应避免使用</div>
                            <div><strong>Class 2</strong>：非遗传毒性致癌物、神经毒性、致畸 — 限制使用</div>
                            <div><strong>Class 3</strong>：低毒性 — 按 GMP 或其他质量标准控制</div>
                          </div>
                        }
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      <Table
                        columns={solventColumns}
                        dataSource={q3cResult.solvents_found}
                        rowKey="name_en"
                        pagination={false}
                        scroll={{ x: 800 }}
                        size="small"
                      />
                    </Card>

                    {showReport && (
                      <Card title="合规报告" style={{ marginTop: 16 }}>
                        <pre style={{ 
                          whiteSpace: 'pre-wrap', 
                          fontFamily: 'monospace',
                          background: '#f5f5f5',
                          padding: 16,
                          borderRadius: 4,
                          maxHeight: 500,
                          overflow: 'auto'
                        }}>
                          {q3cResult.report}
                        </pre>
                      </Card>
                    )}
                    
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Button onClick={() => setShowReport(!showReport)}>
                        {showReport ? '隐藏报告' : '查看合规报告'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
      {/* LLM 配置弹窗 */}
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
          <Form.Item 
            name="api_key" 
            label="API Key" 
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item 
            name="base_url" 
            label="API Base URL"
            rules={[{ required: true, message: '请输入 Base URL' }]}
          >
            <Input placeholder="https://api.deepseek.com/v1" />
          </Form.Item>
          <Form.Item 
            name="model" 
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="deepseek-v4-flash" />
          </Form.Item>
        </Form>
        
        {llmConfig.is_configured && (
          <Alert
            message="当前已配置"
            description={`API Key: ${llmConfig.api_key} | 模型: ${llmConfig.model}`}
            type="success"
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}
        
        {llmTestResult && (
          <Alert
            message={llmTestResult.success ? '连接成功' : '连接失败'}
            description={llmTestResult.message}
            type={llmTestResult.success ? 'success' : 'error'}
            showIcon
            icon={llmTestResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          />
        )}
      </Modal>
    </div>
  )
}
