'use client'

import { useCallback } from 'react'
import { App, Table, Tag, Button, Space, Select, Input } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { MaintenancePlan, MaintenancePlanStatus } from '@/types/equipment'
import { useEquipmentStore } from '@/stores/equipment'
import { deleteMaintenancePlan } from '@/actions/equipment'

const statusConfig: Record<MaintenancePlanStatus, { color: string; label: string; bgColor: string }> = {
  '启用': { color: '#1aae39', label: '启用', bgColor: '#e6f7e6' },
  '停用': { color: '#787671', label: '停用', bgColor: '#f0eeec' },
  '已完成': { color: '#5645d4', label: '已完成', bgColor: '#ede9f7' },
}

interface MaintenancePlanTableProps {
  onRefresh?: () => void
  equipments: { id: string; name: string; equipment_no: string }[]
}

export function MaintenancePlanTable({ onRefresh, equipments }: MaintenancePlanTableProps) {
  const { message, modal } = App.useApp()
  const {
    maintenancePlans, maintenancePlanTotal, maintenancePlanPage, maintenancePlanPageSize,
    maintenancePlanLoading, maintenancePlanStatusFilter, maintenancePlanKeyword,
    setMaintenancePlanPage, setMaintenancePlanPageSize, setMaintenancePlanStatusFilter,
    setMaintenancePlanKeyword, openMaintenancePlanDrawer,
  } = useEquipmentStore()

  const handleDelete = useCallback((record: MaintenancePlan) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除此维护计划吗？',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteMaintenancePlan(record.id)
          message.success('删除成功')
          onRefresh?.()
        } catch (error: any) {
          message.error(error?.message || '删除失败')
        }
      },
    })
  }, [modal, message, onRefresh])

  const isOverdue = (dateStr: string | null): boolean => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  const columns: ColumnsType<MaintenancePlan> = [
    {
      title: '计划名称', dataIndex: 'plan_name', key: 'plan_name', width: 160,
    },
    {
      title: '关联设备', dataIndex: 'equipment_name', key: 'equipment_name', width: 150,
      render: (name: string | undefined, record) => name || record.equipment_id,
    },
    {
      title: '维护类型', dataIndex: 'plan_type', key: 'plan_type', width: 110,
      render: (type: string) => (
        <Tag style={{
          color: type === '预防性维护' ? '#5645d4' : '#dd5b00',
          background: type === '预防性维护' ? '#ede9f7' : '#fff7e6',
          border: 'none', borderRadius: 4, fontWeight: 500,
        }}>{type}</Tag>
      ),
    },
    {
      title: '维护频率', key: 'frequency', width: 110,
      render: (_: unknown, record: MaintenancePlan) => `${record.frequency}${record.frequency_unit}`,
    },
    {
      title: '上次维护', dataIndex: 'last_maintenance_date', key: 'last_maintenance_date', width: 110,
      render: (date: string | null) => date || '-',
    },
    {
      title: '下次维护', dataIndex: 'next_maintenance_date', key: 'next_maintenance_date', width: 120,
      render: (date: string | null) => {
        if (!date) return '-'
        const overdue = isOverdue(date)
        return (
          <span style={{ color: overdue ? '#e03131' : '#1a1a1a', fontWeight: overdue ? 600 : 400 }}>
            {date}
            {overdue && <Tag color="error" style={{ marginLeft: 4, fontSize: 11 }}>逾期</Tag>}
          </span>
        )
      },
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: MaintenancePlanStatus) => {
        const config = statusConfig[status]
        return <Tag style={{ color: config.color, background: config.bgColor, border: 'none', borderRadius: 4, fontWeight: 500 }}>{config.label}</Tag>
      },
    },
    {
      title: '操作', key: 'action', width: 150, fixed: 'end',
      render: (_: unknown, record: MaintenancePlan) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openMaintenancePlanDrawer(record)} style={{ padding: 0 }}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} style={{ padding: 0 }}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <Space>
          <Select
            placeholder="计划状态" allowClear style={{ width: 120 }}
            value={maintenancePlanStatusFilter || undefined}
            onChange={(v) => setMaintenancePlanStatusFilter(v || '')}
            options={[
              { label: '启用', value: '启用' },
              { label: '停用', value: '停用' },
              { label: '已完成', value: '已完成' },
            ]}
          />
          <Input.Search
            placeholder="搜索计划名称" allowClear style={{ width: 200 }}
            value={maintenancePlanKeyword || undefined}
            onChange={(e) => setMaintenancePlanKeyword(e.target.value)}
            onSearch={(v) => setMaintenancePlanKeyword(v)}
          />
        </Space>
      </div>
      <Table
        columns={columns} dataSource={maintenancePlans} rowKey="id" size="small" loading={maintenancePlanLoading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: maintenancePlanPage, pageSize: maintenancePlanPageSize, total: maintenancePlanTotal,
          showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条`,
          onChange: (p, s) => { setMaintenancePlanPage(p); setMaintenancePlanPageSize(s) },
        }}
      />
    </div>
  )
}
