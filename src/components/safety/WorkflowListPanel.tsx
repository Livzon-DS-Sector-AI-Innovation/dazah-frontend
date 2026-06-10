'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  App,
  Modal,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, SearchOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { getHazardIdentifications, deleteHazardIdentification } from '@/actions/safety'
import type { HazardIdentification } from '@/types/safety'
import {
  AI_NODE_PROGRESS_OPTIONS,
  OVERALL_STATUS_OPTIONS_HI,
  RISK_LEVEL_OPTIONS,
} from '@/types/safety'

// 搜索栏 AI 进度筛选项（排除 initial 状态 pending_input）
const AI_PROGRESS_FILTER_OPTIONS = AI_NODE_PROGRESS_OPTIONS.filter(
  (o) => o.value !== 'pending_input'
).map((o) => ({ value: o.value, label: o.label }))

export default function WorkflowListPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HazardIdentification[]>([])
  const [total, setTotal] = useState(0)
  const [queryParams, setQueryParams] = useState({ page: 1, page_size: 20 })
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [progressFilter, setProgressFilter] = useState<string | undefined>()
  const { message } = App.useApp()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getHazardIdentifications({
        ...queryParams,
        keyword: keyword || undefined,
        overall_status: statusFilter,
        ai_node_progress: progressFilter,
      })
      if (res.code === 200) {
        setData(res.data as HazardIdentification[])
        setTotal(res.meta?.total || 0)
      }
    } catch {
      message.error('加载列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [queryParams])

  const handleSearch = () => {
    setQueryParams({ page: 1, page_size: queryParams.page_size })
    loadData()
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该危险源辨识记录吗？',
      onOk: async () => {
        const res = await deleteHazardIdentification(id)
        if (res.code === 200) {
          message.success('删除成功')
          loadData()
        } else {
          message.error(res.message || '删除失败')
        }
      },
    })
  }

  const getStatusTag = (status: string) => {
    const opt = OVERALL_STATUS_OPTIONS_HI.find((o) => o.value === status)
    return <Tag color={opt?.color}>{opt?.label || status}</Tag>
  }

  const getProgressTag = (progress: string) => {
    const opt = AI_NODE_PROGRESS_OPTIONS.find((o) => o.value === progress)
    return <Tag color={opt?.color || 'processing'}>{opt?.label || progress}</Tag>
  }

  const getRiskTag = (level?: string, label?: string) => {
    if (!level) return '-'
    const opt = RISK_LEVEL_OPTIONS.find((o) => o.value === level)
    return <Tag color={opt?.color}>{label || level}</Tag>
  }

  const columns: ColumnsType<HazardIdentification> = [
    { title: '编号', dataIndex: 'hazard_id_no', key: 'hazard_id_no', width: 120 },
    { title: '部门', dataIndex: 'department', key: 'department', width: 100, ellipsis: true },
    { title: '岗位', dataIndex: 'position', key: 'position', width: 90, ellipsis: true },
    {
      title: '生产步骤', dataIndex: 'production_step', key: 'production_step', width: 160, ellipsis: true,
    },
    {
      title: '风险等级', key: 'risk_level', width: 110,
      render: (_, r) => getRiskTag(r.inherent_risk_level, r.inherent_risk_label),
    },
    {
      title: 'AI进度', dataIndex: 'ai_node_progress', key: 'ai_node_progress', width: 110,
      render: (v: string) => getProgressTag(v),
    },
    {
      title: '状态', dataIndex: 'overall_status', key: 'overall_status', width: 80,
      render: (v: string) => getStatusTag(v),
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 120,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      }) : '-',
    },
    {
      title: '操作', key: 'action', width: 120, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button
            type="link" size="small" icon={<EyeOutlined />}
            onClick={() => router.push(`/safety/hazard-identification/${r.id}`)}
          >
            查看
          </Button>
          <Button
            type="link" size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(r.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
            危险源辨识工作流
          </h1>
          <p style={{ fontSize: 14, color: '#5d5b54', margin: '4px 0 0' }}>
            AI 7步危险源辨识与风险评价管理
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/safety/hazard-identification/new')}
        >
          新建辨识
        </Button>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#f6f5f4', borderRadius: 12, border: '1px solid #e5e3df',
        padding: '16px 20px', marginBottom: 16,
      }}>
        <Space wrap>
          <Input
            placeholder="搜索编号/部门/岗位"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="AI进度"
            allowClear
            value={progressFilter}
            onChange={(v) => setProgressFilter(v)}
            style={{ width: 160 }}
            options={AI_PROGRESS_FILTER_OPTIONS}
          />
          <Select
            placeholder="状态"
            allowClear
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            style={{ width: 110 }}
            options={OVERALL_STATUS_OPTIONS_HI.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
        </Space>
      </div>

      {/* Table */}
      <div style={{
        borderRadius: 12, border: '1px solid #e5e3df', padding: 16, background: '#fff',
      }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          size="small"
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.page_size,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setQueryParams({ page, page_size: pageSize }),
          }}
        />
      </div>
    </div>
  )
}
