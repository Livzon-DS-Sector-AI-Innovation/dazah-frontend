'use client'

import { useCallback } from 'react'
import { App, Table, Tag, Space, Button, Input, Select } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { DeviationListItem, DeviationStatus, DeviationLevel } from '@/types/quality'
import { useDeviationStore } from '@/stores/quality'
import { deleteDeviation } from '@/actions/quality'
import Link from 'next/link'

const statusConfig: Record<DeviationStatus, { color: string; bgColor: string; label: string }> = {
  draft: { color: '#787671', bgColor: '#f0eeec', label: '草稿' },
  pending_ai_analysis: { color: '#1677ff', bgColor: '#e6f4ff', label: '待AI分析' },
  pending_investigation: { color: '#7b3ff2', bgColor: '#e6e0f5', label: '待调查' },
  pending_dept_head_review: { color: '#dd5b00', bgColor: '#fff7e6', label: '待部门审核' },
  pending_cross_dept_head_review: { color: '#dd5b00', bgColor: '#fff7e6', label: '待跨部门审核' },
  pending_qa_review: { color: '#dd5b00', bgColor: '#fff7e6', label: '待QA审核' },
  pending_qa_head_review: { color: '#dd5b00', bgColor: '#fff7e6', label: '待QA负责人审核' },
  pending_quality_head_review: { color: '#dd5b00', bgColor: '#fff7e6', label: '待质量负责人审核' },
  pending_final_code: { color: '#13c2c2', bgColor: '#e6fffb', label: '待编号' },
  returned: { color: '#e03131', bgColor: '#fff1f0', label: '已退回' },
  closed: { color: '#1aae39', bgColor: '#e6f7e6', label: '已关闭' },
  cancelled: { color: '#787671', bgColor: '#f0eeec', label: '已取消' },
}

const levelConfig: Record<DeviationLevel, { color: string; bgColor: string; label: string }> = {
  minor: { color: '#1aae39', bgColor: '#e6f7e6', label: '微小' },
  moderate: { color: '#dd5b00', bgColor: '#fff7e6', label: '中等' },
  major: { color: '#e03131', bgColor: '#fff1f0', label: '严重' },
}

const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  label: config.label,
  value,
}))

const levelOptions = Object.entries(levelConfig).map(([value, config]) => ({
  label: config.label,
  value,
}))

interface DeviationTableProps {
  loading?: boolean
  onRefresh?: () => void
}

export function DeviationTable({ loading = false, onRefresh }: DeviationTableProps) {
  const { message, modal } = App.useApp()
  const {
    deviations,
    total,
    page,
    pageSize,
    statusFilter,
    levelFilter,
    departmentFilter,
    keyword,
    setPage,
    setPageSize,
    setStatusFilter,
    setLevelFilter,
    setDepartmentFilter,
    setKeyword,
  } = useDeviationStore()

  const handleDelete = useCallback((record: DeviationListItem) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除偏差 "${record.title}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteDeviation(record.id)
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
      title: '偏差编号',
      dataIndex: 'deviation_code',
      key: 'deviation_code',
      width: 150,
      fixed: 'start' as const,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (text: string, record: DeviationListItem) => (
        <Link href={`/quality/deviations/${record.id}`} className="text-blue-600 hover:text-blue-800">
          {text}
        </Link>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (v: string | null) => v || '-',
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: DeviationLevel | null) => {
        if (!level) return '-'
        const config = levelConfig[level] || { color: '#787671', bgColor: '#f0eeec', label: level }
        return (
          <Tag style={{ color: config.color, background: config.bgColor, border: 'none', borderRadius: 4, fontWeight: 500 }}>
            {config.label}
          </Tag>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: DeviationStatus) => {
        const config = statusConfig[status] || { color: '#787671', bgColor: '#f0eeec', label: status }
        return (
          <Tag style={{ color: config.color, background: config.bgColor, border: 'none', borderRadius: 4, fontWeight: 500 }}>
            {config.label}
          </Tag>
        )
      },
    },
    {
      title: '发现日期',
      dataIndex: 'discovery_date',
      key: 'discovery_date',
      width: 120,
      render: (v: string | null) => v ? new Date(v).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'end' as const,
      render: (_: unknown, record: DeviationListItem) => (
        <Space>
          <Link href={`/quality/deviations/${record.id}`}>
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
          style={{ width: 140 }}
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value || '')}
          options={statusOptions}
        />
        <Select
          placeholder="级别"
          allowClear
          style={{ width: 100 }}
          value={levelFilter || undefined}
          onChange={(value) => setLevelFilter(value || '')}
          options={levelOptions}
        />
        <Input
          placeholder="部门"
          style={{ width: 120 }}
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          allowClear
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
        dataSource={deviations}
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
