'use client'

import { useState, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Typography,
  Space,
  Tag,
  Popconfirm,
  Tooltip,
  message,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons'
import {
  createAPICallConfig,
  updateAPICallConfig,
  activateAPICallConfig,
  deleteAPICallConfig,
} from '@/actions/safety'
import { AI_MODEL_OPTIONS } from '@/types/safety'
import type { APICallConfig } from '@/types/safety'

const { Title, Text } = Typography
const { TextArea } = Input

interface Props {
  initialConfigs: APICallConfig[]
}

export default function APICallConfigClient({ initialConfigs }: Props) {
  const [configs, setConfigs] = useState<APICallConfig[]>(initialConfigs)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<APICallConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  const loadConfigs = useCallback(async () => {
    setLoading(true)
    try {
      const { getAPICallConfigs } = await import('@/actions/safety')
      const res = await getAPICallConfigs()
      setConfigs(res.data || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreate = () => {
    setEditingConfig(null)
    form.resetFields()
    form.setFieldsValue({
      temperature: 0.1,
      timeout_seconds: 120,
      is_active: false,
    })
    setModalOpen(true)
  }

  const handleEdit = (record: APICallConfig) => {
    setEditingConfig(record)
    form.setFieldsValue({
      config_name: record.config_name,
      api_base_url: record.api_base_url,
      api_key: record.api_key,
      model_name: record.model_name,
      temperature: record.temperature,
      timeout_seconds: record.timeout_seconds,
      max_tokens: record.max_tokens,
      is_active: record.is_active,
      notes: record.notes,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteAPICallConfig(id)
    if (res.code === 0) {
      message.success('删除成功')
      loadConfigs()
    } else {
      message.error(res.message || '删除失败')
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      if (editingConfig) {
        const res = await updateAPICallConfig(editingConfig.id, values)
        if (res.code === 0) {
          message.success('更新成功')
          setModalOpen(false)
          loadConfigs()
        } else {
          message.error(res.message || '更新失败')
        }
      } else {
        const res = await createAPICallConfig(values)
        if (res.code === 0) {
          message.success('创建成功')
          setModalOpen(false)
          loadConfigs()
        } else {
          message.error(res.message || '创建失败')
        }
      }
    } catch {
      // validation error
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (id: string) => {
    setTestingId(id)
    try {
      const res = await activateAPICallConfig(id)
      if (res.code === 0) {
        message.success('已激活，所有 AI 调用将使用此配置')
        loadConfigs()
      } else {
        message.error(res.message || '激活失败')
      }
    } catch {
      message.error('激活失败')
    } finally {
      setTestingId(null)
    }
  }

  const columns = [
    {
      title: '配置名称',
      dataIndex: 'config_name',
      key: 'config_name',
      width: 180,
      render: (name: string, record: APICallConfig) => (
        <Space>
          {name}
          {record.is_active && <Tag color="success">当前使用</Tag>}
        </Space>
      ),
    },
    {
      title: 'API 地址',
      dataIndex: 'api_base_url',
      key: 'api_base_url',
      ellipsis: true,
      width: 260,
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 160,
      render: (model: string) => {
        const opt = AI_MODEL_OPTIONS.find((o) => o.value === model)
        return <Tag color="purple">{opt?.label || model}</Tag>
      },
    },
    {
      title: 'Temperature',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '超时(s)',
      dataIndex: 'timeout_seconds',
      key: 'timeout_seconds',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Max Tokens',
      dataIndex: 'max_tokens',
      key: 'max_tokens',
      width: 90,
      align: 'center' as const,
      render: (v: number | undefined) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      align: 'center' as const,
      render: (active: boolean) =>
        active ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            激活
          </Tag>
        ) : (
          <Tag>未激活</Tag>
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      align: 'center' as const,
      render: (_: unknown, record: APICallConfig) => (
        <Space>
          {!record.is_active && (
            <Tooltip title="激活此配置">
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                loading={testingId === record.id}
                onClick={() => handleActivate(record.id)}
              >
                激活
              </Button>
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此配置？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: '#37352f' }}>
            API 调用配置
          </Title>
          <Text style={{ fontSize: 14, color: '#787671' }}>
            配置 AI 大模型 API 连接参数。同一时间仅一个配置生效。
            若未配置，系统使用环境变量中的默认连接。
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          style={{ borderRadius: 8, background: '#5645d4' }}
        >
          新建配置
        </Button>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 12, border: '1px solid #e5e3df' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingConfig ? '编辑 API 调用配置' : '新建 API 调用配置'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        width={640}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ style: { borderRadius: 8, background: '#5645d4' } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="config_name"
            label="配置名称"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="例如：生产环境 GPT-4o" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="api_base_url"
            label="API 基础 URL"
            rules={[{ required: true, message: '请输入 API 地址' }]}
          >
            <Input placeholder="https://api.openai.com/v1" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="api_key"
            label="API 密钥"
            rules={[{ required: true, message: '请输入 API 密钥' }]}
          >
            <Input.Password placeholder="sk-..." style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="model_name"
            label="模型名称"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select
              options={AI_MODEL_OPTIONS}
              placeholder="选择 AI 模型"
              showSearch
            />
          </Form.Item>

          <Space size="middle">
            <Form.Item name="temperature" label="Temperature">
              <InputNumber min={0} max={2} step={0.1} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="timeout_seconds" label="超时(秒)">
              <InputNumber min={10} max={600} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="max_tokens" label="Max Tokens">
              <InputNumber min={100} max={128000} style={{ width: 120 }} placeholder="不限" />
            </Form.Item>
          </Space>

          <Form.Item name="is_active" label="激活状态" valuePropName="checked">
            <Switch checkedChildren="激活" unCheckedChildren="未激活" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="配置说明" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
