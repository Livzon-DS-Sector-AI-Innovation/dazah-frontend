'use client'

import { useState } from 'react'
import { Modal, Form, Input, App } from 'antd'
import { replyRectification, reworkRectification } from '@/actions/safety'
import type { HazardReport } from '@/types/safety'

const { TextArea } = Input

interface Props {
  open: boolean
  record: HazardReport | null
  mode: 'reply' | 'rework' // reply = in_progress → replied, rework = rejected → replied
  onClose: () => void
  onSuccess: (updated: HazardReport) => void
}

export default function HazardRectificationReplyModal({
  open,
  record,
  mode,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const { message } = App.useApp()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const data = {
        reply_content: values.reply_content,
        rectification_photos: values.rectification_photos || undefined,
      }
      const action = mode === 'reply' ? replyRectification : reworkRectification
      const response = await action(record!.id, data)
      if (response.code === 200) {
        message.success(mode === 'reply' ? '整改回复已提交' : '已重新提交整改回复')
        onSuccess(response.data!)
        form.resetFields()
        onClose()
      } else {
        message.error(response.message || '操作失败')
      }
    } catch {
      // validation error
    } finally {
      setSubmitting(false)
    }
  }

  const title = mode === 'reply' ? '整改回复' : '重新整改'

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="提交"
      cancelText="取消"
      width={600}
      destroyOnHidden
    >
      {/* 隐患信息摘要 */}
      {record && (
        <div
          style={{
            background: '#faf9f7',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          <div>
            <strong>隐患编号：</strong>
            {record.hazard_no}
          </div>
          <div>
            <strong>隐患描述：</strong>
            {record.description}
          </div>
          <div>
            <strong>地点/部位：</strong>
            {record.location || '-'}
          </div>
          {record.rectification_responsible_person_name && (
            <div>
              <strong>责任人：</strong>
              {record.rectification_responsible_person_name}
            </div>
          )}
          {record.corrective_preventive_measures && (
            <div>
              <strong>整改要求：</strong>
              {record.corrective_preventive_measures}
            </div>
          )}
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="reply_content"
          label="整改实施情况"
          rules={[{ required: true, message: '请描述整改实施情况' }]}
        >
          <TextArea
            rows={5}
            placeholder="请详细描述整改实施情况，包括具体整改措施、实施过程、完成情况等"
          />
        </Form.Item>
        <Form.Item
          name="rectification_photos"
          label="整改后图片（JSON数组）"
          extra="暂时输入图片URL的JSON数组，如 [&quot;url1&quot;,&quot;url2&quot;]"
        >
          <TextArea
            rows={2}
            placeholder='["https://example.com/image1.jpg","https://example.com/image2.jpg"]'
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
