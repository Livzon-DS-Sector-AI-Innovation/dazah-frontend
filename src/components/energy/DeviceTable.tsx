'use client'

import { App, Table, Tag, Space, Button, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import { EnergyDeviceConfig, EnergyType } from '@/types/energy'
import { useEnergyStore } from '@/stores/energy'
import { deleteEnergyDevice } from '@/actions/energy'

interface DeviceTableProps {
  data: EnergyDeviceConfig[]
  loading?: boolean
  total?: number
  onRefresh: () => void
}

const energyTypeLabels: Record<EnergyType, { text: string; color: string }> = {
  electricity: { text: '电力', color: 'blue' },
  water: { text: '水', color: 'cyan' },
  gas: { text: '气体', color: 'orange' },
}

export function DeviceTable({
  data,
  loading = false,
  total = 0,
  onRefresh,
}: DeviceTableProps) {
  const { message } = App.useApp()
  const { deviceFilters, setDeviceFilters, openDeviceDrawer } =
    useEnergyStore()

  const handleDelete = async (id: string) => {
    try {
      await deleteEnergyDevice(id)
      message.success('删除成功')
      onRefresh()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns: TableColumnsType<EnergyDeviceConfig> = [
    {
      title: '设备名称',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 150,
    },
    {
      title: '能源类型',
      dataIndex: 'energy_type',
      key: 'energy_type',
      width: 100,
      render: (type: EnergyType) => {
        const { text, color } = energyTypeLabels[type]
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '所属车间',
      dataIndex: 'workshop',
      key: 'workshop',
      width: 120,
    },
    {
      title: '所属产线',
      dataIndex: 'production_line',
      key: 'production_line',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '监控级别',
      dataIndex: 'monitor_level',
      key: 'monitor_level',
      width: 100,
      render: (level: string) => {
        const levelMap: Record<string, { text: string; color: string }> = {
          normal: { text: '普通', color: 'default' },
          important: { text: '重要', color: 'warning' },
          critical: { text: '关键', color: 'error' },
        }
        const { text, color } = levelMap[level] || { text: level, color: 'default' }
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      width: 80,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openDeviceDrawer('edit', record.id)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此设备？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
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
        current: deviceFilters.page || 1,
        pageSize: deviceFilters.page_size || 10,
        total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条`,
        onChange: (page, pageSize) => {
          setDeviceFilters({ page, page_size: pageSize })
        },
      }}
    />
  )
}
