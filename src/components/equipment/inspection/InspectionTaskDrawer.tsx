'use client'

import { App, Button, DatePicker, Drawer, Form, Input, Select, Space } from 'antd'
import { useInspectionStore } from '@/stores/inspection'
import { createInspectionTask } from '@/actions/inspection'
import type { InspectionTemplate } from '@/types/equipment'
import dayjs from 'dayjs'

interface InspectionTaskDrawerProps {
  templates: InspectionTemplate[]
  equipments: { id: string; name: string; equipment_no: string }[]
}

export function InspectionTaskDrawer({ templates, equipments }: InspectionTaskDrawerProps) {
  const { message } = App.useApp()
  const { taskDrawerOpen, closeTaskDrawer, triggerTasksRefresh } = useInspectionStore()
  const [form] = Form.useForm()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await createInspectionTask({
        route_id: values.route_id || undefined,
        equipment_ids: values.equipment_ids && values.equipment_ids.length > 0 ? values.equipment_ids : undefined,
        template_id: values.template_id,
        plan_type: values.plan_type || '专项巡检',
        assigned_to: values.assigned_to || undefined,
        planned_date: values.planned_date.format('YYYY-MM-DD'),
      })
      message.success('巡检任务已创建')
      form.resetFields()
      closeTaskDrawer()
      triggerTasksRefresh()
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown[] })?.errorFields) return
      message.error((err as Error).message || '创建失败')
    }
  }

  return (
    <Drawer
      title="创建巡检任务"
      size={480}
      open={taskDrawerOpen}
      onClose={closeTaskDrawer}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={closeTaskDrawer} style={{ borderRadius: 8 }}>取消</Button>
          <Button type="primary" onClick={handleSubmit} style={{ borderRadius: 8 }}>创建</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="plan_type" label="巡检类型" initialValue="专项巡检">
          <Select
            options={[
              { label: '日常巡检', value: '日常巡检' },
              { label: '周巡检', value: '周巡检' },
              { label: '月巡检', value: '月巡检' },
              { label: '专项巡检', value: '专项巡检' },
            ]}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item name="template_id" label="检查模板" rules={[{ required: true, message: '请选择检查模板' }]}>
          <Select
            showSearch
            placeholder="选择检查模板"
            optionFilterProp="label"
            options={templates.map(t => ({ label: t.name, value: t.id }))}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="equipment_ids"
          label="巡检设备（多选，至少一个）"
          rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一台设备' }]}
        >
          <Select
            mode="multiple"
            showSearch
            placeholder="选择要巡检的设备（可多选）"
            optionFilterProp="label"
            options={equipments.map(e => ({ label: `${e.name} (${e.equipment_no})`, value: e.id }))}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item name="planned_date" label="计划日期" rules={[{ required: true, message: '请选择计划日期' }]}
          initialValue={dayjs()}
        >
          <DatePicker style={{ width: '100%', borderRadius: 8 }} />
        </Form.Item>

        <Form.Item name="assigned_to" label="巡检人员ID（可选）">
          <Input placeholder="输入巡检人员ID" style={{ borderRadius: 8 }} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
