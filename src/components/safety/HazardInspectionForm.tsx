'use client'

import { useState } from 'react'
import {
  Form,
  Input,
  DatePicker,
  Select,
  Upload,
  Button,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Divider,
} from 'antd'
import {
  UploadOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { HAZARD_LOCATION_OPTIONS } from '@/types/safety'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Text, Title } = Typography
const { Dragger } = Upload

export interface InspectionFormValues {
  inspection_category?: string
  location?: string
  discovered_by_name?: string
  department?: string
  discovered_at?: string
  description?: string
}

interface Props {
  initialValues?: InspectionFormValues
  loading: boolean
  onSubmit: (values: InspectionFormValues, files: File[]) => Promise<void>
  onSaveDraft: (values: InspectionFormValues, files: File[]) => Promise<void>
}

export default function HazardInspectionForm({
  initialValues,
  loading,
  onSubmit,
  onSaveDraft,
}: Props) {
  const [form] = Form.useForm<InspectionFormValues>()
  const [fileList, setFileList] = useState<any[]>([])

  // 回填草稿数据
  useState(() => {
    if (initialValues) {
      form.setFieldsValue({
        inspection_category: initialValues.inspection_category,
        // mode="tags" Select 需要数组格式
        location: initialValues.location ? [initialValues.location] : undefined,
        discovered_by_name: initialValues.discovered_by_name,
        department: initialValues.department,
        description: initialValues.description,
        discovered_at: initialValues.discovered_at
          ? dayjs(initialValues.discovered_at)
          : undefined,
      } as any)
    }
  })

  // 规范化表单值：mode="tags" 字段返回数组，需转为字符串
  const normalizeValues = (values: any): InspectionFormValues => ({
    ...values,
    location: Array.isArray(values.location) ? values.location[0] : values.location,
    discovered_at: values.discovered_at
      ? dayjs(values.discovered_at).toISOString()
      : undefined,
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const rawFiles = fileList
        .filter((f) => f.originFileObj)
        .map((f) => f.originFileObj as File)
      await onSubmit(normalizeValues(values), rawFiles)
    } catch {
      // 表单校验失败
    }
  }

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      const rawFiles = fileList
        .filter((f) => f.originFileObj)
        .map((f) => f.originFileObj as File)
      await onSaveDraft(normalizeValues(values), rawFiles)
    } catch {
      // 草稿允许不完整，直接取 form 当前值
      const values = form.getFieldsValue()
      const rawFiles = fileList
        .filter((f) => f.originFileObj)
        .map((f) => f.originFileObj as File)
      await onSaveDraft(normalizeValues(values), rawFiles)
    }
  }

  return (
    <Card
      style={{ borderRadius: 12, border: '1px solid #e5e3df', maxWidth: 720, margin: '0 auto' }}
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          🔍 登记隐患信息
        </Title>
        <Text type="secondary">填写隐患基本信息并上传图片，AI 将自动识别并回填分类信息</Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          discovered_at: dayjs(),
          ...initialValues,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="inspection_category"
              label="检查类别"
              rules={[{ required: true, message: '请选择检查类别' }]}
            >
              <Select
                placeholder="请选择检查类别"
                options={[
                  { value: '日常检查', label: '日常检查' },
                  { value: '专项检查', label: '专项检查' },
                  { value: '综合检查', label: '综合检查' },
                  { value: '节假日检查', label: '节假日检查' },
                  { value: '月度安全检查', label: '月度安全检查' },
                  { value: '季节性安全检查', label: '季节性安全检查' },
                  { value: '节前安全检查', label: '节前安全检查' },
                  { value: '周检', label: '周检' },
                  { value: '复工复产安全检查', label: '复工复产安全检查' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="location"
              label="地点/部位"
              rules={[{ required: true, message: '请选择或输入地点' }]}
            >
              <Select
                mode="tags"
                maxCount={1}
                placeholder="请选择或输入地点"
                options={HAZARD_LOCATION_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="discovered_by_name"
              label="发现人"
              rules={[{ required: true, message: '请输入发现人' }]}
            >
              <Input placeholder="请输入发现人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label="责任部门"
              rules={[{ required: true, message: '请输入责任部门' }]}
            >
              <Input placeholder="请输入责任部门" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="discovered_at"
              label="发现时间"
              rules={[{ required: true, message: '请选择发现时间' }]}
            >
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="隐患描述（可选）">
          <TextArea
            rows={3}
            placeholder="可选填写隐患描述。如上传图片，AI 将自动识别并生成描述。"
          />
        </Form.Item>

        <Divider />

        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 14 }}>
            📷 隐患图片上传
          </Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
            上传隐患现场图片，AI 将自动分析识别隐患信息（支持 JPG/PNG，单张不超过 10MB）
          </Text>
        </div>
        <Dragger
          multiple
          fileList={fileList}
          beforeUpload={() => false}
          accept="image/*"
          listType="picture-card"
          onChange={(info) => setFileList(info.fileList)}
          style={{ marginBottom: 24 }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
          <p className="ant-upload-hint">支持批量上传</p>
        </Dragger>

        <Divider />

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
            disabled={loading}
          >
            保存草稿
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={handleSubmit}
            loading={loading}
          >
            提交并AI分析
          </Button>
        </Space>
      </Form>
    </Card>
  )
}
