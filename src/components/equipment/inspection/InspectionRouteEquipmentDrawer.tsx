'use client'

import { useEffect, useState, useCallback } from 'react'
import { App, Button, Drawer, Space, Table, Select, InputNumber } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useInspectionStore } from '@/stores/inspection'
import { setRouteEquipments } from '@/actions/inspection'
import { fetchInspectionRouteById } from '@/lib/api/inspection'
import type { RouteEquipment } from '@/types/inspection'

interface InspectionRouteEquipmentDrawerProps {
  equipments: { id: string; name: string; equipment_no: string }[]
}

interface RowData {
  key: string
  equipment_id: string
  equipment_name?: string
  equipment_no?: string
  sort_order: number
  isNew?: boolean
}

export function InspectionRouteEquipmentDrawer({ equipments }: InspectionRouteEquipmentDrawerProps) {
  const { message } = App.useApp()
  const {
    routeEquipmentDrawerOpen, editingRouteId, closeRouteEquipmentDrawer,
  } = useInspectionStore()
  const [rows, setRows] = useState<RowData[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadEquipment = useCallback(async () => {
    if (!editingRouteId) return
    setLoading(true)
    try {
      const detail = await fetchInspectionRouteById(editingRouteId)
      setRows((detail.equipments || []).map(eq => ({
        key: eq.id,
        equipment_id: eq.equipment_id,
        equipment_name: eq.equipment_name,
        equipment_no: eq.equipment_no,
        sort_order: eq.sort_order,
      })))
    } catch {
      message.error('加载路线设备失败')
    } finally {
      setLoading(false)
    }
  }, [editingRouteId, message])

  useEffect(() => {
    if (routeEquipmentDrawerOpen && editingRouteId) {
      loadEquipment()
    }
  }, [routeEquipmentDrawerOpen, editingRouteId, loadEquipment])

  const handleAdd = () => {
    setRows(prev => [...prev, {
      key: `new_${Date.now()}`,
      equipment_id: '',
      sort_order: prev.length,
      isNew: true,
    }])
  }

  const handleDelete = (key: string) => {
    setRows(prev => prev.filter(r => r.key !== key))
  }

  const handleEquipmentChange = (key: string, value: string) => {
    const eq = equipments.find(e => e.id === value)
    setRows(prev => prev.map(r => r.key === key ? { ...r, equipment_id: value, equipment_name: eq?.name, equipment_no: eq?.equipment_no } : r))
  }

  const handleSortChange = (key: string, value: number | null) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, sort_order: value || 0 } : r))
  }

  const handleSave = async () => {
    if (!editingRouteId) return
    const valid = rows.filter(r => r.equipment_id)
    if (valid.length === 0) {
      message.warning('请至少添加一台设备')
      return
    }
    setSaving(true)
    try {
      await setRouteEquipments(editingRouteId, valid.map(r => ({
        equipment_id: r.equipment_id,
        sort_order: r.sort_order,
      })))
      message.success('路线设备配置已保存')
      closeRouteEquipmentDrawer()
    } catch (err: unknown) {
      message.error((err as Error).message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<RowData> = [
    {
      title: '序号', key: 'sort', width: 70,
      render: (_: unknown, __: RowData, index: number) => index + 1,
    },
    {
      title: '设备', key: 'equipment', width: 260,
      render: (_: unknown, record: RowData) => (
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="选择设备"
          value={record.equipment_id || undefined}
          onChange={(v) => handleEquipmentChange(record.key, v)}
          optionFilterProp="label"
          options={equipments.map(e => ({ label: `${e.name} (${e.equipment_no})`, value: e.id }))}
        />
      ),
    },
    {
      title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 80,
      render: (v: number, record: RowData) => (
        <InputNumber
          size="small"
          min={0}
          value={v}
          onChange={(val) => handleSortChange(record.key, val)}
          style={{ width: 60 }}
        />
      ),
    },
    {
      title: '操作', key: 'action', width: 60,
      render: (_: unknown, record: RowData) => (
        <Button type="link" danger icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.key)}
          style={{ padding: 0 }} />
      ),
    },
  ]

  return (
    <Drawer
      title="配置路线设备"
      size={600}
      open={routeEquipmentDrawerOpen}
      onClose={closeRouteEquipmentDrawer}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={closeRouteEquipmentDrawer} style={{ borderRadius: 8 }}>取消</Button>
          <Button type="primary" onClick={handleSave} loading={saving} style={{ borderRadius: 8 }}>保存</Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <Button icon={<PlusOutlined />} onClick={handleAdd} style={{ borderRadius: 8 }}>添加设备</Button>
      </div>
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="key"
        size="small"
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </Drawer>
  )
}
