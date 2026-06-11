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
  Divider
} from 'antd'
import { 
  UploadOutlined, 
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'

const { Title, Text } = Typography

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
  elements_found: ElementResult[]
  total_elements: number
  summary: {
    class_1: number
    class_2a: number
    class_2b: number
    class_3: number
    other: number
  }
}

interface Q3CResult {
  type: 'Q3C'
  text_length: number
  solvents_found: SolventResult[]
  total_solvents: number
  summary: {
    class_1: number
    class_2: number
    class_3: number
    unknown: number
  }
}

export function ICHAnalysisPage() {
  const [activeTab, setActiveTab] = useState<string>('q3d')
  const [q3dResult, setQ3dResult] = useState<Q3DResult | null>(null)
  const [q3cResult, setQ3cResult] = useState<Q3CResult | null>(null)
  const [loading, setLoading] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

  // ICH Q3D 分析
  const handleQ3DUpload = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`${API_BASE}/research/ich/q3d/analyze`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: '分析失败' }))
        throw new Error(error.message || '分析失败')
      }
      
      const data = await res.json()
      setQ3dResult(data.data)
      message.success('ICH Q3D 分析完成')
    } catch (error: any) {
      message.error(error.message || '分析失败')
    } finally {
      setLoading(false)
    }
    return false // 阻止自动上传
  }

  // ICH Q3C 分析
  const handleQ3CUpload = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`${API_BASE}/research/ich/q3c/analyze`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: '分析失败' }))
        throw new Error(error.message || '分析失败')
      }
      
      const data = await res.json()
      setQ3cResult(data.data)
      message.success('ICH Q3C 分析完成')
    } catch (error: any) {
      message.error(error.message || '分析失败')
    } finally {
      setLoading(false)
    }
    return false // 阻止自动上传
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
      width: 200,
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
      title: '口服 PDE (μg/天)',
      dataIndex: 'oral_pde',
      key: 'oral_pde',
      width: 130,
      render: (v: number) => v ?? '-',
    },
    {
      title: '注射 PDE (μg/天)',
      dataIndex: 'parenteral_pde',
      key: 'parenteral_pde',
      width: 130,
      render: (v: number) => v ?? '-',
    },
    {
      title: '吸入 PDE (μg/天)',
      dataIndex: 'inhalation_pde',
      key: 'inhalation_pde',
      width: 130,
      render: (v: number) => v ?? '-',
    },
    {
      title: '皮肤 PDE (μg/天)',
      dataIndex: 'cutaneous_pde',
      key: 'cutaneous_pde',
      width: 130,
      render: (v: number) => v ?? '-',
    },
    {
      title: 'CTCL (μg/g)',
      dataIndex: 'ctcl',
      key: 'ctcl',
      width: 100,
      render: (v: number) => v ?? '-',
    },
    {
      title: '评估建议',
      key: 'assessment',
      width: 250,
      render: (_: any, record: ElementResult) => {
        const parts: string[] = []
        if (record.oral_assess) parts.push('口服')
        if (record.parenteral_assess) parts.push('注射')
        if (record.inhalation_assess) parts.push('吸入')
        if (record.cutaneous_assess) parts.push('皮肤')
        
        if (parts.length === 0) {
          return <Tag color="green">无需评估</Tag>
        }
        if (parts.length === 4) {
          return <Tag color="red">所有途径需评估</Tag>
        }
        return <Tag color="orange">{parts.join('、')}需评估</Tag>
      },
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

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <ExperimentOutlined /> ICH Q3C、Q3D 杂质识别
      </Title>
      
      <Alert
        message="ICH 杂质识别工具"
        description="上传药品合成工艺文件（DOCX格式），自动识别元素杂质（Q3D）和溶剂残留（Q3C），并根据 ICH 指南进行分类和评估建议。"
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
                  <Alert
                    message="支持的文件格式"
                    description="仅支持 Microsoft Word DOCX 格式文件（.docx）"
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                </Card>

                {q3dResult && (
                  <>
                    <Card title="分析结果概览" style={{ marginBottom: 16 }}>
                      <Descriptions bordered column={2}>
                        <Descriptions.Item label="文本长度">
                          {q3dResult.text_length} 字符
                        </Descriptions.Item>
                        <Descriptions.Item label="识别元素总数">
                          {q3dResult.total_elements} 个
                        </Descriptions.Item>
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
                        <Descriptions.Item label="Other 元素">
                          <Tag>{q3dResult.summary.other} 个</Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    <Card title="元素杂质详细列表">
                      <Alert
                        message="评估说明"
                        description={
                          <div>
                            <div><strong>Class 1</strong>：人体毒性与环保关注元素，所有途径必须评估</div>
                            <div><strong>Class 2A</strong>：出现概率高，需评估所有潜在来源</div>
                            <div><strong>Class 2B</strong>：出现概率较低，除非有意添加，否则可排除</div>
                            <div><strong>Class 3</strong>：口服毒性低，除非有意添加否则口服无需评估</div>
                            <div><strong>Other</strong>：未建立 PDE，需逐案毒理学论证</div>
                            <div style={{ marginTop: 8 }}><strong>CTCL</strong>：皮肤毒性浓度限度（Ni、Co 为 35 μg/g，基于致敏性）</div>
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
                        scroll={{ x: 1600 }}
                        size="small"
                      />
                    </Card>
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
                    description="仅支持 Microsoft Word DOCX 格式文件（.docx）"
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
                        <Descriptions.Item label="识别溶剂总数">
                          {q3cResult.total_solvents} 个
                        </Descriptions.Item>
                        <Descriptions.Item label="Class 1 溶剂">
                          <Tag color="red">{q3cResult.summary.class_1} 个</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Class 2 溶剂">
                          <Tag color="orange">{q3cResult.summary.class_2} 个</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Class 3 溶剂">
                          <Tag color="green">{q3cResult.summary.class_3} 个</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="未分类溶剂">
                          <Tag>{q3cResult.summary.unknown} 个</Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    <Card title="溶剂残留详细列表">
                      <Alert
                        message="分类说明"
                        description={
                          <div>
                            <div><strong>Class 1</strong>：致癌物、疑似致癌物、环境危害物 — 应避免使用</div>
                            <div><strong>Class 2</strong>：非遗传毒性致癌物、神经毒性、致畸 — 限制使用</div>
                            <div><strong>Class 3</strong>：低毒性 — 无长期毒性研究，GMP 或其他质量标准限制</div>
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
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
