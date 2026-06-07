'use client'

import { useEffect, useState, useCallback } from 'react'
import { App, Drawer, Button, Space, Table, Form, Input, InputNumber, Typography, Empty, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useEquipmentStore } from '@/stores/equipment'
import {
  createInspectionTemplateItem,
  updateInspectionTemplateItem,
  deleteInspectionTemplateItem,
} from '@/actions/equipment'
import { fetchInspectionTemplateByIdClient } from '@/lib/api/equipment-client'
import type { InspectionTemplateItem } from '@/types/equipment'

const { Text } = Typography

interface ItemFormValues {
  item_name: string
  item_description: string
  expected_result: string
  check_method: string
  sort_order: number
}

// ── 检查项表单（独立组件，仅在需要时挂载以避免 useForm 未连接 Form 的警告）──
function InspectionItemForm({
  mode,
  templateId,
  itemsCount,
  initialValues,
  onSuccess,
  onCancel,
}: {
  mode: 'create' | string
  templateId: string
  itemsCount: number
  initialValues?: ItemFormValues
  onSuccess: () => void
  onCancel: () => void
}) {
  const { message } = App.useApp()
  const [form] = Form.useForm<ItemFormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (mode === 'create') {
      form.resetFields()
      form.setFieldsValue({
        sort_order: itemsCount,
        item_name: '',
        item_description: '',
        expected_result: '',
        check_method: '',
      })
    } else if (initialValues) {
      form.setFieldsValue(initialValues)
    }
  }, [mode, itemsCount, initialValues, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      if (mode === 'create') {
        await createInspectionTemplateItem(templateId, {
          item_name: values.item_name,
          item_description: values.item_description || undefined,
          expected_result: values.expected_result || undefined,
          check_method: values.check_method || undefined,
          sort_order: values.sort_order,
        })
        message.success('检查项已添加')
      } else {
        await updateInspectionTemplateItem(mode, {
          item_name: values.item_name,
          item_description: values.item_description || undefined,
          expected_result: values.expected_result || undefined,
          check_method: values.check_method || undefined,
          sort_order: values.sort_order,
        })
        message.success('检查项已更新')
      }
      onSuccess()
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown[] })?.errorFields) return
      message.error((err as Error).message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      marginBottom: 16, padding: 16,
      background: '#fafaf9', borderRadius: 12,
      border: '1px solid #e5e3df',
    }}>
      <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
        {mode === 'create' ? '新增检查项' : '编辑检查项'}
      </Text>
      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="item_name" label="检查项名称" rules={[{ required: true, message: '请输入检查项名称' }]}>
            <Input placeholder="如：温度检查" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%', borderRadius: 8 }} placeholder="0" />
          </Form.Item>
          <Form.Item name="item_description" label="描述">
            <Input placeholder="检查项描述" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="expected_result" label="预期结果">
            <Input placeholder="如：温度在20-30℃之间" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="check_method" label="检查方法">
            <Input placeholder="如：目视检查/仪表读数" style={{ borderRadius: 8 }} />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel} icon={<CloseOutlined />} style={{ borderRadius: 8 }}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting} icon={<SaveOutlined />} style={{ borderRadius: 8 }}>
            {mode === 'create' ? '添加' : '保存'}
          </Button>
        </div>
      </Form>
    </div>
  )
}

export function InspectionItemDrawer() {
  const { message } = App.useApp()
  const {
    inspectionItemDrawerOpen,
    inspectionItemTemplateId,
    editingInspectionItem,
    closeInspectionItemDrawer,
  } = useEquipmentStore()

  const [items, setItems] = useState<InspectionTemplateItem[]>([])
  const [loading, setLoading] = useState(false)

  // 表单模式：null=浏览模式，'create'=新增，string=编辑的 item id
  const [formMode, setFormMode] = useState<'create' | string | null>(null)

  // 加载检查项列表
  const loadItems = useCallback(async () => {
    if (!inspectionItemTemplateId) return
    setLoading(true)
    try {
      const detail = await fetchInspectionTemplateByIdClient(inspectionItemTemplateId)
      setItems(detail.items || [])
    } catch {
      message.error('加载检查项失败')
    } finally {
      setLoading(false)
    }
  }, [inspectionItemTemplateId, message])

  useEffect(() => {
    if (inspectionItemDrawerOpen && inspectionItemTemplateId) {
      loadItems()
      if (editingInspectionItem) {
        setFormMode(editingInspectionItem.id)
      } else {
        setFormMode(null)
      }
    }
  }, [inspectionItemDrawerOpen, inspectionItemTemplateId, editingInspectionItem, loadItems])

  // 关闭时清理
  const handleClose = () => {
    setFormMode(null)
    closeInspectionItemDrawer()
  }

  const handleStartCreate = () => setFormMode('create')
  const handleStartEdit = (item: InspectionTemplateItem) => setFormMode(item.id)
  const handleCancelEdit = () => setFormMode(null)
  const handleFormSuccess = () => { setFormMode(null); loadItems() }

  // 获取编辑模式的初始值
  const editingInitialValues: ItemFormValues | undefined =
    editingInspectionItem && formMode === editingInspectionItem.id
      ? {
          item_name: editingInspectionItem.item_name,
          item_description: editingInspectionItem.item_description || '',
          expected_result: editingInspectionItem.expected_result || '',
          check_method: editingInspectionItem.check_method || '',
          sort_order: editingInspectionItem.sort_order,
        }
      : undefined

  // 删除
  const handleDelete = async (item: InspectionTemplateItem) => {
    try {
      await deleteInspectionTemplateItem(item.id)
      message.success('检查项已删除')
      await loadItems()
    } catch (err: unknown) {
      message.error((err as Error).message || '删除失败')
    }
  }

  const columns: ColumnsType<InspectionTemplateItem> = [
    {
      title: '#',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 50,
    },
    {
      title: '检查项名称',
      dataIndex: 'item_name',
      key: 'item_name',
      width: 180,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'item_description',
      key: 'item_description',
      width: 180,
      render: (v: string | null) => v || '-',
    },
    {
      title: '预期结果',
      dataIndex: 'expected_result',
      key: 'expected_result',
      width: 140,
      render: (v: string | null) => v || '-',
    },
    {
      title: '检查方法',
      dataIndex: 'check_method',
      key: 'check_method',
      width: 140,
      render: (v: string | null) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'end' as const,
      render: (_: unknown, record: InspectionTemplateItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleStartEdit(record)}
            style={{ padding: '0 4px' }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此检查项？"
            onConfirm={() => handleDelete(record)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: '0 4px' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Drawer
      title="管理检查项"
      size={780}
      open={inspectionItemDrawerOpen}
      onClose={handleClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose} style={{ borderRadius: 8 }}>关闭</Button>
        </Space>
      }
    >
      {/* 新增按钮 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          共 {items.length} 个检查项
        </Text>
        {formMode !== 'create' && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleStartCreate}
            style={{ borderRadius: 8 }}
          >
            添加检查项
          </Button>
        )}
      </div>

      {/* 新增/编辑表单 — 仅在 formMode 非 null 时挂载，避免 useForm 未连接警告 */}
      {formMode && (
        <InspectionItemForm
          mode={formMode}
          templateId={inspectionItemTemplateId!}
          itemsCount={items.length}
          initialValues={formMode !== 'create' ? editingInitialValues : undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelEdit}
        />
      )}

      {/* 检查项列表 */}
      {items.length === 0 && !loading ? (
        <Empty
          description="暂无检查项，请点击上方按钮添加"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          size="small"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: '暂无检查项' }}
        />
      )}
    </Drawer>
  )
}
