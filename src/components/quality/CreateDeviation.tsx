'use client'

import { useRouter } from 'next/navigation'
import { App, Card, Form, Input, Select, Button, DatePicker, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { createDeviation } from '@/actions/quality'

export function CreateDeviation() {
  const router = useRouter()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const handleSubmit = async (values: any) => {
    try {
      const result = await createDeviation({
        ...values,
        discovery_date: values.discovery_date?.toISOString(),
      })
      message.success('创建成功')
      router.push('/quality/deviations')
    } catch (error: any) {
      message.error(error?.message || '创建失败')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/quality/deviations')}>
          返回
        </Button>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>新建偏差</h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 800 }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入偏差标题" />
          </Form.Item>

          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请输入部门' }]}
          >
            <Input placeholder="请输入发现偏差的部门" />
          </Form.Item>

          <Form.Item name="discovery_date" label="发现日期">
            <DatePicker showTime style={{ width: '100%' }} placeholder="选择发现日期" />
          </Form.Item>

          <Form.Item name="level" label="级别">
            <Select
              placeholder="选择偏差级别"
              allowClear
              options={[
                { label: '微小', value: 'minor' },
                { label: '中等', value: 'moderate' },
                { label: '严重', value: 'major' },
              ]}
            />
          </Form.Item>

          <Form.Item name="root_cause_category" label="根本原因类别">
            <Select
              placeholder="选择原因类别"
              allowClear
              options={[
                { label: '人员', value: '人员' },
                { label: '设施/设备', value: '设施/设备' },
                { label: '产品/物料', value: '产品/物料' },
                { label: '文件', value: '文件' },
                { label: '环境', value: '环境' },
                { label: '其它', value: '其它' },
              ]}
            />
          </Form.Item>

          <Form.Item name="description" label="偏差描述">
            <Input.TextArea rows={4} placeholder="详细描述偏差情况" />
          </Form.Item>

          <Form.Item name="immediate_actions" label="即时措施">
            <Input.TextArea rows={3} placeholder="描述已采取的即时措施" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建偏差
              </Button>
              <Button onClick={() => router.push('/quality/deviations')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
