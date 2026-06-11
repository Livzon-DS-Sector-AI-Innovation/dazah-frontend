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
  name: string
  class: string
  oral_pde?: number
  parenteral_pde?: number
  inhalation_pde?: number
  found_in_text: boolean
}

interface SolventResult {
  name_en: string
  name_cn: string
  class: string
  limit_ppm?: number
  pde_mg_day?: number
  concern?: string
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
      width: 100,
    },
    {
      title: '元素名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: 'Q3D 分类',
      dataIndex: 'class',
      key: 'class',
      width: 120,
      render: (cls: string) => {
        const colors: Record<string, string> = {
          'Class 1': 'red',
          'Class 2A': 'orange',
          'Class 2B': 'gold',
          'Class 3': 'blue',
        }
        return <Tag color={colors[cls] || 'default'}>{cls}</Tag>
      },
    },
    {
      title: '口服 PDE (μg/天)',
      dataIndex: 'oral_pde',
      key: 'oral_pde',
      width: 150,
      render: (v: number) => v || '-',
    },
    {
      title: '注射 PDE (μg/天)',
      dataIndex: 'parenteral_pde',
      key: 'parenteral_pde',
      width: 150,
      render: (v: number) => v || '-',
    },
    {
      title: '吸入 PDE (μg/天)',
      dataIndex: 'inhalation_pde',
      key: 'inhalation_pde',
      width: 150,
      render: (v: number) => v || '-',
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
      width: 180,
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
        }
        return <Tag color={colors[cls] || 'default'}>{cls}</Tag>
      },
    },
    {
      title: '限度 (ppm)',
      dataIndex: 'limit_ppm',
      key: 'limit_ppm',
      width: 120,
      render: (v: number) => v || '-',
    },
    {
      title: 'PDE (mg/天)',
      dataIndex: 'pde_mg_day',
      key: 'pde_mg_day',
      width: 120,
      render: (v: number) => v || '-',
    },
    {
      title: '关注点',
      dataIndex: 'concern',
      key: 'concern',
      width: 200,
      render: (v: string) => v || '-',
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>ICH Q3C、Q3D 杂质识别</Title>
      <Text type="secondary">
        上传合成工艺 DOCX 文件，自动识别元素杂质（Q3D）和溶剂残留（Q3C）
      </Text>

      <Divider />

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
                      </Descriptions>
                    </Card>

                    <Card title="元素杂质详细列表">
                      <Table
                        columns={elementColumns}
                        dataSource={q3dResult.elements_found}
                        rowKey="symbol"
                        pagination={false}
                        scroll={{ x: 800 }}
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
                      </Descriptions>
                    </Card>

                    <Card title="溶剂残留详细列表">
                      <Table
                        columns={solventColumns}
                        dataSource={q3cResult.solvents_found}
                        rowKey="name_en"
                        pagination={false}
                        scroll={{ x: 900 }}
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
