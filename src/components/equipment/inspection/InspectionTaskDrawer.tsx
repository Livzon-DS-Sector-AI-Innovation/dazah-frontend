'use client'

import { useEffect, useState } from 'react'
import { App, Avatar, Button, DatePicker, Drawer, Form, Select, Space, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useInspectionStore } from '@/stores/inspection'
import { createInspectionTask } from '@/actions/inspection'
import { fetchInspectionRoutes } from '@/lib/api/inspection'
import { fetchPersonnelList } from '@/lib/api/equipment-personnel'
import type { InspectionTemplate } from '@/types/equipment'
import type { InspectionRoute } from '@/types/inspection'
import type { Personnel } from '@/types/equipment-personnel'
import dayjs from 'dayjs'

const { Text } = Typography

interface InspectionTaskDrawerProps {
  templates: InspectionTemplate[]
  equipments: { id: string; name: string; equipment_no: string }[]
}

const AVATAR_COLORS = ['#5645d4', '#7b3ff2', '#dd5b00', '#0075de', '#1aae39', '#2a9d99']

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function InspectionTaskDrawer({ templates, equipments }: InspectionTaskDrawerProps) {
  const { message } = App.useApp()
  const { taskDrawerOpen, closeTaskDrawer, triggerTasksRefresh } = useInspectionStore()
  const [form] = Form.useForm()
  const [routes, setRoutes] = useState<InspectionRoute[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [planType, setPlanType] = useState<string>('设备巡检')

  // 打开抽屉时预加载路线列表和人员列表
  useEffect(() => {
    if (taskDrawerOpen) {
      if (routes.length === 0) {
        fetchInspectionRoutes({ page: 1, page_size: 200 }).then(res => {
          setRoutes(res.items.filter(r => r.is_active))
        }).catch(() => {})
      }
      fetchPersonnelList({}).then(res => {
        setPersonnel(res.items.filter(p => p.is_active))
      }).catch(() => {})
    }
  }, [taskDrawerOpen, routes.length])

  // 当选择线路巡检且选中路线时，自动填充模板
  const handleRouteChange = (routeId: string) => {
    const route = routes.find(r => r.id === routeId)
    if (route?.template_id) {
      form.setFieldValue('template_id', route.template_id)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const isRouteMode = values.plan_type === '线路巡检'
      await createInspectionTask({
        route_id: isRouteMode ? values.route_id : (values.route_id || undefined),
        equipment_ids: isRouteMode
          ? undefined
          : (values.equipment_ids && values.equipment_ids.length > 0 ? values.equipment_ids : undefined),
        template_id: values.template_id || undefined,
        plan_type: values.plan_type || '设备巡检',
        assigned_to: values.assigned_to || undefined,
        planned_date: values.planned_date.format('YYYY-MM-DD'),
      })
      message.success('巡检任务已创建')
      form.resetFields()
      setPlanType('设备巡检')
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
      onClose={() => { closeTaskDrawer(); setPlanType('设备巡检') }}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={() => { closeTaskDrawer(); setPlanType('设备巡检') }} style={{ borderRadius: 8 }}>取消</Button>
          <Button type="primary" onClick={handleSubmit} style={{ borderRadius: 8 }}>创建</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" preserve={false}
        onValuesChange={(changed) => {
          if ('plan_type' in changed) {
            setPlanType(changed.plan_type)
            // 切换类型时清空关联字段
            if (changed.plan_type === '线路巡检') {
              form.setFieldValue('equipment_ids', undefined)
            } else {
              form.setFieldValue('route_id', undefined)
            }
          }
        }}
      >
        <Form.Item name="plan_type" label="巡检类型" initialValue="设备巡检">
          <Select
            options={[
              { label: '线路巡检', value: '线路巡检' },
              { label: '设备巡检', value: '设备巡检' },
            ]}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        {/* 线路巡检模式：显示路线选择器 */}
        {planType === '线路巡检' && (
          <Form.Item
            name="route_id"
            label="巡检线路"
            rules={[{ required: true, message: '请选择巡检线路' }]}
          >
            <Select
              showSearch
              placeholder="选择巡检线路"
              optionFilterProp="label"
              onChange={handleRouteChange}
              options={routes.map(r => ({
                label: `${r.name}${r.area ? ` (${r.area})` : ''} - ${r.equipment_count}台设备`,
                value: r.id,
              }))}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        )}

        {/* 设备巡检模式：显示设备选择器 */}
        {planType === '设备巡检' && (
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
        )}

        <Form.Item
          name="template_id"
          label={planType === '线路巡检' ? '检查模板（自动从路线获取，可修改）' : '检查模板'}
          rules={planType === '设备巡检' ? [{ required: true, message: '请选择检查模板' }] : undefined}
        >
          <Select
            showSearch
            allowClear={planType === '线路巡检'}
            placeholder={planType === '线路巡检' ? '默认使用路线配置的模板' : '选择检查模板'}
            optionFilterProp="label"
            options={templates.map(t => ({ label: t.name, value: t.id }))}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item name="planned_date" label="计划日期" rules={[{ required: true, message: '请选择计划日期' }]}
          initialValue={dayjs()}
        >
          <DatePicker style={{ width: '100%', borderRadius: 8 }} />
        </Form.Item>

        <Form.Item name="assigned_to" label="巡检人员" rules={[{ required: true, message: '请选择巡检人员' }]}>
          <Select
            showSearch
            placeholder="请选择巡检人员"
            optionFilterProp="label"
            options={personnel.map(p => ({
              label: `${p.name}${p.department ? ` · ${p.department}` : ''}`,
              value: p.user_id || p.id,
            }))}
            optionRender={(option) => {
              const p = personnel.find(pe => (pe.user_id || pe.id) === option.value)
              if (!p) return <Text>{option.label}</Text>
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar
                    size={28}
                    src={p.avatar_url || undefined}
                    style={{
                      backgroundColor: p.avatar_url ? 'transparent' : avatarColor(p.name),
                      flexShrink: 0, fontSize: 11, fontWeight: 700,
                    }}
                    icon={!p.avatar_url ? <UserOutlined /> : undefined}
                  >
                    {!p.avatar_url ? p.name.charAt(0) : undefined}
                  </Avatar>
                  <div style={{ lineHeight: 1.3 }}>
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</Text>
                    {p.department && (
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                        {p.department}{p.employee_no ? ` · ${p.employee_no}` : ''}
                      </Text>
                    )}
                  </div>
                </div>
              )
            }}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
