'use client'

import { useCallback } from 'react'
import { App, Table, Tag, Space, Button, Input, Select } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { CapaListItem, CapaWorkflowStatus, CapaSource, CapaCategory } from '@/types/quality'
import { useCapaStore } from '@/stores/quality'
import { deleteCapa } from '@/actions/quality'
import Link from 'next/link'

const statusConfig: Record<CapaWorkflowStatus, { color: string; bgColor: string; label: string }> = {
  draft: { color: '#787671', bgColor: '#f0eeec', label: '草稿' },
  part_a: { color: '#1677ff', bgColor: '#e6f4ff', label: 'A部分' },
  part_b: { color: '#1677ff', bgColor: '#e6f4ff', label: 'B部分' },
  part_c: { color: '#1677ff', bgColor: '#e6f4ff', label: 'C部分' },
  pending_dept_head_confirm: { color: '#fa8c16', bgColor: '#fff7e6', label: '待部门主管确认' },
  pending_qa_review: { color: '#fa8c16', bgColor: '#fff7e6', label: '待QA审核' },
  pending_q_head_approval: { color: '#fa8c16', bgColor: '#fff7e6', label: '待质量主管审批' },
  executing: { color: '#13c2c2', bgColor: '#e6fffb', label: '执行中' },
  pending_evaluation: { color: '#722ed1', bgColor: '#f9f0ff', label: '待效果评价' },
  submitted: { color: '#1677ff', bgColor: '#e6f4ff', label: '已提交' },
  under_execution: { color: '#7b3ff2', bgColor: '#e6e0f5', label: '执行中' },
  evaluation: { color: '#dd5b00', bgColor: '#fff7e6', label: '评估中' },
  closed: { color: '#1aae39', bgColor: '#e6f7e6', label: '已关闭' },
  returned: { color: '#e03131', bgColor: '#fff1f0', label: '已退回' },
  cancelled: { color: '#787671', bgColor: '#f0eeec', label: '已取消' },
}

const sourceConfig: Record<CapaSource, { label: string }> = {
  deviation: { label: '偏差' },
  audit: { label: '审计' },
  customer_complaint: { label: '客户投诉' },
  internal_inspection: { label: '内部检查' },
}

const categoryOptions = [
  { label: 'A类', value: 'A' },
  { label: 'B类', value: 'B' },
  { label: 'C类', value: 'C' },
]

const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  label: config.label,
  value,
}))

const sourceOptions = Object.entries(sourceConfig).map(([value, config]) => ({
  label: config.label,
  value,
}))

interface CapaTableProps {
  loading?: boolean
  onRefresh?: () => void
}

export function CapaTable({ loading = false, onRefresh }: CapaTableProps) {
  const { message, modal } = App.useApp()
  const {
    capas,
    total,
    page,
    pageSize,
    statusFilter,
    sourceFilter,
    categoryFilter,
    keyword,
    setPage,
    setPageSize,
    setStatusFilter,
    setSourceFilter,
    setCategoryFilter,
    setKeyword,
  } = useCapaStore()

  const handleDelete = useCallback((record: CapaListItem) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除CAPA "${record.title}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteCapa(record.id)
          message.success('删除成功')
          onRefresh?.()
        } catch (error: any) {
          message.error(error?.message || '删除失败')
        }
      },
    })
  }, [modal, message, onRefresh])

  const columns = [
    {
      title: 'CAPA编号',
      dataIndex: 'capa_code',
      key: 'capa_code',
      width: 150,
      fixed: 'start' as const,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (text: string, record: CapaListItem) => (
        <Link href={`/quality/capas/${record.id}`} className="text-blue-600 hover:text-blue-800">
          {text}
        </Link>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: CapaSource | null) => {
        if (!source) return '-'
        const config = sourceConfig[source] || { label: source }
        return config.label
      },
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (category: CapaCategory | null) => category || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CapaWorkflowStatus) => {
        const config = statusConfig[status] || { color: '#787671', bgColor: '#f0eeec', label: status }
        return (
          <Tag style={{ color: config.color, background: config.bgColor, border: 'none', borderRadius: 4, fontWeight: 500 }}>
            {config.label}
          </Tag>
        )
      },
    },
    {
      title: '预期完成日期',
      dataIndex: 'expected_completion_date',
      key: 'expected_completion_date',
      width: 120,
      render: (v: string | null) => v ? new Date(v).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'end' as const,
      render: (_: unknown, record: CapaListItem) => (
        <Space>
          <Link href={`/quality/capas/${record.id}`}>
            <Button type="link" icon={<EditOutlined />} style={{ padding: 0 }}>
              查看
            </Button>
          </Link>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} style={{ padding: 0 }}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 120 }}
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value || '')}
          options={statusOptions}
        />
        <Select
          placeholder="来源"
          allowClear
          style={{ width: 120 }}
          value={sourceFilter || undefined}
          onChange={(value) => setSourceFilter(value || '')}
          options={sourceOptions}
        />
        <Select
          placeholder="类别"
          allowClear
          style={{ width: 100 }}
          value={categoryFilter || undefined}
          onChange={(value) => setCategoryFilter(value || '')}
          options={categoryOptions}
        />
        <Input
          placeholder="搜索编号或标题"
          prefix={<SearchOutlined style={{ color: '#a4a097' }} />}
          style={{ width: 240 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
        />
      </div>
      <Table
        columns={columns}
        dataSource={capas}
        rowKey="id"
        size="small"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage)
            setPageSize(newPageSize)
          },
        }}
      />
    </div>
  )
}
