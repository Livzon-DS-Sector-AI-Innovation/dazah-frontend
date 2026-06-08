'use client'

import { Table, Tag, Button, Space } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import { CollectLog, CollectStatus } from '@/types/energy'
import { useEnergyStore } from '@/stores/energy'

interface CollectLogTableProps {
  data: CollectLog[]
  loading?: boolean
  total?: number
  onRefresh: () => void
  onRetry?: (id: string) => void
}

const statusLabels: Record<CollectStatus, { text: string; color: string }> = {
  success: { text: '成功', color: 'success' },
  failed: { text: '失败', color: 'error' },
  timeout: { text: '超时', color: 'warning' },
}

export function CollectLogTable({
  data,
  loading = false,
  total = 0,
  onRefresh,
  onRetry,
}: CollectLogTableProps) {
  const { logFilters, setLogFilters, openCollectLogDrawer } = useEnergyStore()

  const columns: TableColumnsType<CollectLog> = [
    {
      title: '采集时间',
      dataIndex: 'collected_at',
      key: 'collected_at',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '设备名称',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 150,
    },
    {
      title: '采集状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CollectStatus) => {
        const { text, color } = statusLabels[status]
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '采集值',
      dataIndex: 'collected_value',
      key: 'collected_value',
      width: 120,
      render: (value, record) =>
        value !== undefined && value !== null
          ? `${value} ${record.unit || ''}`
          : '-',
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) =>
        duration !== undefined && duration !== null ? `${duration}ms` : '-',
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      width: 200,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => openCollectLogDrawer(record.id)}
          >
            详情
          </Button>
          {record.status === 'failed' && onRetry && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => onRetry(record.config_id)}
            >
              重试
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={{
        current: logFilters.page || 1,
        pageSize: logFilters.page_size || 10,
        total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条`,
        onChange: (page, pageSize) => {
          setLogFilters({ page, page_size: pageSize })
        },
      }}
    />
  )
}
