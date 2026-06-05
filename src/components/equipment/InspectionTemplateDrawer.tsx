'use client'

import { useEffect } from 'react'
import { App, Drawer, Form, Input, Select, Switch, Button, Space } from 'antd'
import { useEquipmentStore } from '@/stores/equipment'
import { createInspectionTemplate, updateInspectionTemplate } from '@/actions/equipment'
import { CreateInspectionTemplateInput, UpdateInspectionTemplateInput } from '@/types/equipment'

const { TextArea } = Input

interface EquipmentCategory {
  id: string
  name: string
}

interface InspectionTemplateDrawerProps {
  categories: EquipmentCategory[]
  onRefresh?: () => void
}

export function InspectionTemplateDrawer({ categories, onRefresh }: InspectionTemplateDrawerProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { inspectionTemplateDrawerOpen, editingInspectionTemplate, closeInspectionTemplateDrawer } = useEquipmentStore()

  useEffect(() => {
    if (inspectionTemplateDrawerOpen) {
      if (editingInspectionTemplate) {
        form.setFieldsValue({
          name: editingInspectionTemplate.name,
          description: editingInspectionTemplate.description,
          equipment_category_id: editingInspectionTemplate.equipment_category_id || undefined,
          is_active: editingInspectionTemplate.is_active,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ is_active: true })
      }
    }
  }, [inspectionTemplateDrawerOpen, editingInspectionTemplate, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingInspectionTemplate) {
        const data: UpdateInspectionTemplateInput = {
          name: values.name,
          description: values.description || undefined,
          equipment_category_id: values.equipment_category_id || undefined,
          is_active: values.is_active,
        }
        await updateInspectionTemplate(editingInspectionTemplate.id, data)
        message.success('更新成功')
      } else {
        const data: CreateInspectionTemplateInput = {
          name: values.name,
          description: values.description || undefined,
          equipment_category_id: values.equipment_category_id || undefined,
        }
        await createInspectionTemplate(data)
        message.success('创建成功')
      }
      closeInspectionTemplateDrawer()
      onRefresh?.()
    } catch (error: any) {
      if (error?.message) message.error(error.message)
    }
  }

  return (
    <Drawer
      title={editingInspectionTemplate ? '编辑巡检模板' : '新建巡检模板'}
      size={480}
      open={inspectionTemplateDrawerOpen}
      onClose={closeInspectionTemplateDrawer}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={closeInspectionTemplateDrawer}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>{editingInspectionTemplate ? '保存' : '创建'}</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
        <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
          <Input placeholder="请输入模板名称" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <TextArea placeholder="模板描述（可选）" rows={3} maxLength={500} showCount />
        </Form.Item>
        <Form.Item name="equipment_category_id" label="设备分类">
          <Select placeholder="选择设备分类（可选）" allowClear showSearch optionFilterProp="label"
            options={categories.map((c) => ({ label: c.name, value: c.id }))} />
        </Form.Item>
        {editingInspectionTemplate && (
          <Form.Item name="is_active" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  )
}
