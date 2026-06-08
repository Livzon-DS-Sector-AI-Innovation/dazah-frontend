'use client'

import { useEffect } from 'react'
import { App, Button, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import { useInspectionStore } from '@/stores/inspection'
import { createInspectionRoute, updateInspectionRoute } from '@/actions/inspection'
import type { InspectionTemplate } from '@/types/equipment'

interface InspectionRouteDrawerProps {
  templates: InspectionTemplate[]
}

export function InspectionRouteDrawer({ templates }: InspectionRouteDrawerProps) {
  const { message } = App.useApp()
  const {
    routeDrawerOpen, editingRoute, closeRouteDrawer, triggerRoutesRefresh,
  } = useInspectionStore()
  const [form] = Form.useForm()

  useEffect(() => {
    if (routeDrawerOpen) {
      if (editingRoute) {
        form.setFieldsValue(editingRoute)
      } else {
        form.resetFields()
      }
    }
  }, [routeDrawerOpen, editingRoute, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRoute) {
        await updateInspectionRoute(editingRoute.id, values)
        message.success('路线已更新')
      } else {
        await createInspectionRoute(values)
        message.success('路线已创建')
      }
      form.resetFields()
      closeRouteDrawer()
      triggerRoutesRefresh()
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown[] })?.errorFields) return
      message.error((err as Error).message || '操作失败')
    }
  }

  return (
    <Drawer
      title={editingRoute ? '编辑巡检路线' : '新建巡检路线'}
      size={480}
      open={routeDrawerOpen}
      onClose={closeRouteDrawer}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={closeRouteDrawer} style={{ borderRadius: 8 }}>取消</Button>
          <Button type="primary" onClick={handleSubmit} style={{ borderRadius: 8 }}>
            {editingRoute ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="name" label="路线名称" rules={[{ required: true, message: '请输入路线名称' }]}>
          <Input placeholder="如：A车间一楼日检路线" style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item name="area" label="区域">
          <Input placeholder="如：A车间" style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item name="period_type" label="巡检周期" initialValue="每日">
          <Select
            options={[
              { label: '每日', value: '每日' },
              { label: '每周', value: '每周' },
              { label: '每月', value: '每月' },
              { label: '专项（无周期）', value: '专项' },
            ]}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
        <Form.Item name="period_value" label="周期数值（如每2天填2）">
          <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} placeholder="1" />
        </Form.Item>
        <Form.Item name="template_id" label="默认检查模板">
          <Select
            showSearch
            allowClear
            placeholder="选择默认检查模板"
            optionFilterProp="label"
            options={templates.map(t => ({ label: t.name, value: t.id }))}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
        <Form.Item name="description" label="路线描述">
          <Input.TextArea rows={3} placeholder="路线描述" style={{ borderRadius: 8 }} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
