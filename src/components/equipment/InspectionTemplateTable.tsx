'use client'

import { useCallback, useState } from 'react'
import { App, Table, Tag, Button, Space, Input } from 'antd'
import { EditOutlined, DeleteOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { InspectionTemplate, InspectionTemplateItem } from '@/types/equipment'
import { useEquipmentStore } from '@/stores/equipment'
import { deleteInspectionTemplate } from '@/actions/equipment'
import { fetchInspectionTemplateByIdClient } from '@/lib/api/equipment-client'

interface EquipmentCategory {
  id: string
  name: string
}

interface InspectionTemplateTableProps {
  onRefresh?: () => void
  categories: EquipmentCategory[]
}

export function InspectionTemplateTable({ onRefresh, categories }: InspectionTemplateTableProps) {
  const { message, modal } = App.useApp()
  const {
    inspectionTemplates, inspectionTemplateTotal, inspectionTemplatePage, inspectionTemplatePageSize,
    inspectionTemplateLoading, inspectionTemplateKeyword,
    setInspectionTemplatePage, setInspectionTemplatePageSize, setInspectionTemplateKeyword,
    openInspectionTemplateDrawer, openInspectionItemDrawer,
  } = useEquipmentStore()

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [itemsMap, setItemsMap] = useState<Record<string, InspectionTemplateItem[]>>({})
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({})

  const handleDelete = useCallback((record: InspectionTemplate) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除此巡检模板吗？删除后关联的检查项也将被删除。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteInspectionTemplate(record.id)
          message.success('删除成功')
          onRefresh?.()
        } catch (error: any) {
          message.error(error?.message || '删除失败')
        }
      },
    })
  }, [modal, message, onRefresh])

  const handleExpand = useCallback(async (expanded: boolean, record: InspectionTemplate) => {
    if (expanded) {
      setExpandedRowKeys([record.id])
      if (!itemsMap[record.id]) {
        setItemsLoading((prev) => ({ ...prev, [record.id]: true }))
        try {
          const detail = await fetchInspectionTemplateByIdClient(record.id)
          setItemsMap((prev) => ({ ...prev, [record.id]: detail.items || [] }))
        } catch {
          message.error('获取检查项失败')
        } finally {
          setItemsLoading((prev) => ({ ...prev, [record.id]: false }))
        }
      }
    } else {
      setExpandedRowKeys([])
    }
  }, [itemsMap, message])

  const itemColumns: ColumnsType<InspectionTemplateItem> = [
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 60 },
    { title: '检查项名称', dataIndex: 'item_name', key: 'item_name', width: 180 },
    { title: '描述', dataIndex: 'item_description', key: 'item_description', width: 200, render: (v: string | null) => v || '-' },
    { title: '预期结果', dataIndex: 'expected_result', key: 'expected_result', width: 160, render: (v: string | null) => v || '-' },
    { title: '检查方法', dataIndex: 'check_method', key: 'check_method', width: 160, render: (v: string | null) => v || '-' },
    {
      title: '操作', key: 'action', width: 100, fixed: 'end',
      render: (_: unknown, record: InspectionTemplateItem) => (
        <Space>
          <Button type="link" icon={<EditOutlined />}
            onClick={() => openInspectionItemDrawer(record.template_id, record)}
            style={{ padding: 0 }}>编辑</Button>
        </Space>
      ),
    },
  ]

  const columns: ColumnsType<InspectionTemplate> = [
    {
      title: '模板名称', dataIndex: 'name', key: 'name', width: 180,
    },
    {
      title: '设备分类', dataIndex: 'equipment_category_name', key: 'equipment_category_name', width: 140,
      render: (name: string | undefined) => name || '-',
    },
    {
      title: '描述', dataIndex: 'description', key: 'description', width: 200,
      render: (desc: string | null) => desc || '-',
    },
    {
      title: '检查项数', dataIndex: 'items_count', key: 'items_count', width: 100,
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (active: boolean) => (
        <Tag style={{
          color: active ? '#1aae39' : '#787671',
          background: active ? '#e6f7e6' : '#f0eeec',
          border: 'none', borderRadius: 4, fontWeight: 500,
        }}>{active ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '操作', key: 'action', width: 220, fixed: 'end',
      render: (_: unknown, record: InspectionTemplate) => (
        <Space>
          <Button type="link" icon={<UnorderedListOutlined />}
            onClick={() => openInspectionItemDrawer(record.id)}
            style={{ padding: 0 }}>检查项</Button>
          <Button type="link" icon={<EditOutlined />}
            onClick={() => openInspectionTemplateDrawer(record)}
            style={{ padding: 0 }}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            style={{ padding: 0 }}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <Input.Search
          placeholder="搜索模板名称" allowClear style={{ width: 240 }}
          value={inspectionTemplateKeyword}
          onChange={(e) => setInspectionTemplateKeyword(e.target.value)}
          onSearch={(v) => setInspectionTemplateKeyword(v)}
        />
      </div>
      <Table
        columns={columns} dataSource={inspectionTemplates} rowKey="id" size="small" loading={inspectionTemplateLoading}
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowKeys,
          onExpand: handleExpand,
          expandedRowRender: (record) => (
            <Table
              columns={itemColumns}
              dataSource={itemsMap[record.id] || []}
              rowKey="id"
              size="small"
              loading={itemsLoading[record.id]}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          ),
        }}
        pagination={{
          current: inspectionTemplatePage, pageSize: inspectionTemplatePageSize, total: inspectionTemplateTotal,
          showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条`,
          onChange: (p, s) => { setInspectionTemplatePage(p); setInspectionTemplatePageSize(s) },
        }}
      />
    </div>
  )
}
