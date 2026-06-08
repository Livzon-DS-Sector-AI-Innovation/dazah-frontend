'use client'

import { useEffect, useState } from 'react'
import { App, Drawer, Form, Input, Select, InputNumber, Switch, Button, Space } from 'antd'
import { useEnergyStore } from '@/stores/energy'
import {
  createEnergyDevice,
  updateEnergyDevice,
  getEnergyDeviceById,
} from '@/actions/energy'

const { TextArea } = Input

interface DeviceDrawerProps {
  onRefresh: () => void
}

export function DeviceDrawer({ onRefresh }: DeviceDrawerProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const {
    deviceDrawerOpen,
    deviceDrawerMode,
    deviceDrawerId,
    closeDeviceDrawer,
  } = useEnergyStore()

  const isEdit = deviceDrawerMode === 'edit'

  useEffect(() => {
    if (deviceDrawerOpen && isEdit && deviceDrawerId) {
      loadDeviceData(deviceDrawerId)
    } else if (deviceDrawerOpen && !isEdit) {
      form.resetFields()
      form.setFieldsValue({ is_enabled: true })
    }
  }, [deviceDrawerOpen, deviceDrawerId, isEdit, form])

  const loadDeviceData = async (id: string) => {
    try {
      const device = await getEnergyDeviceById(id)
      form.setFieldsValue(device)
    } catch {
      message.error('获取设备信息失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (isEdit && deviceDrawerId) {
        await updateEnergyDevice(deviceDrawerId, values)
        message.success('更新成功')
      } else {
        await createEnergyDevice(values)
        message.success('创建成功')
      }

      closeDeviceDrawer()
      onRefresh()
    } catch (err: unknown) {
      // Ant Design validation errors have an errorFields property
      if (err && typeof err === 'object' && 'errorFields' in err) return
      if (err instanceof Error) {
        message.error(err.message)
      } else {
        message.error('操作失败')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      title={isEdit ? '编辑设备' : '新增设备'}
      size={480}
      open={deviceDrawerOpen}
      onClose={closeDeviceDrawer}
      destroyOnHidden
      styles={{
        header: { borderBottom: '1px solid #e5e3df', padding: '16px 24px' },
        body: { padding: '24px' },
      }}
      extra={
        <Space>
          <Button onClick={closeDeviceDrawer}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            确定
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        styles={{ label: { fontWeight: 500, color: '#1a1a1a' } }}
      >
        <Form.Item
          name="device_name"
          label="设备名称"
          rules={[{ required: true, message: '请输入设备名称' }]}
        >
          <Input placeholder="请输入设备名称" />
        </Form.Item>

        <Form.Item
          name="platform_code"
          label="平台编码"
          rules={[{ required: true, message: '请输入平台编码' }]}
        >
          <Input placeholder="请输入平台编码" />
        </Form.Item>

        <Form.Item
          name="platform_device_code"
          label="平台设备编码"
          rules={[{ required: true, message: '请输入平台设备编码' }]}
        >
          <Input placeholder="请输入平台设备编码" />
        </Form.Item>

        <Form.Item
          name="energy_type"
          label="能源类型"
          rules={[{ required: true, message: '请选择能源类型' }]}
        >
          <Select
            placeholder="请选择能源类型"
            options={[
              { label: '电力', value: 'electricity' },
              { label: '水', value: 'water' },
              { label: '气体', value: 'gas' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="workshop"
          label="所属车间"
          rules={[{ required: true, message: '请输入所属车间' }]}
        >
          <Input placeholder="请输入所属车间" />
        </Form.Item>

        <Form.Item name="production_line" label="所属产线">
          <Input placeholder="请输入所属产线" />
        </Form.Item>

        <Form.Item
          name="api_endpoint"
          label="API端点"
          rules={[{ required: true, message: '请输入API端点' }]}
        >
          <Input placeholder="请输入API端点" />
        </Form.Item>

        <Form.Item
          name="collection_interval"
          label="采集间隔(分钟)"
          rules={[{ required: true, message: '请输入采集间隔' }]}
        >
          <InputNumber
            min={1}
            max={60}
            placeholder="请输入采集间隔"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="monitor_level"
          label="监控级别"
          rules={[{ required: true, message: '请选择监控级别' }]}
        >
          <Select
            placeholder="请选择监控级别"
            options={[
              { label: '普通', value: 'normal' },
              { label: '重要', value: 'important' },
              { label: '关键', value: 'critical' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="unit"
          label="计量单位"
          rules={[{ required: true, message: '请输入计量单位' }]}
        >
          <Input placeholder="请输入计量单位，如 kWh、m³" />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>

        <Form.Item name="is_enabled" label="是否启用" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
