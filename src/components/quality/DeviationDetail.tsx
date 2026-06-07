'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { App, Card, Descriptions, Tag, Button, Space, Modal, Form, Input, Select, Divider } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, SendOutlined, RedoOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchDeviation, updateDeviation, deleteDeviation, submitInvestigation, submitReview, submitFinalCode, resubmitDeviation } from '@/lib/api/quality'
import type { DeviationDetail as DeviationDetailType, DeviationStatus, ApprovalStep } from '@/types/quality'

const { TextArea } = Input
const { Option } = Select

const STATUS_LABELS: Record<DeviationStatus, string> = {
  draft: '草稿',
  pending_ai_analysis: '待AI分析',
  pending_investigation: '待调查',
  pending_dept_head_review: '待部门主管审核',
  pending_cross_dept_head_review: '待跨部门主管审核',
  pending_qa_review: '待QA审核',
  pending_qa_head_review: '待QA主管审核',
  pending_quality_head_review: '待质量主管审核',
  pending_final_code: '待最终编号',
  returned: '已退回',
  closed: '已关闭',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<DeviationStatus, string> = {
  draft: 'default',
  pending_ai_analysis: 'purple',
  pending_investigation: 'blue',
  pending_dept_head_review: 'orange',
  pending_cross_dept_head_review: 'orange',
  pending_qa_review: 'orange',
  pending_qa_head_review: 'orange',
  pending_quality_head_review: 'orange',
  pending_final_code: 'cyan',
  returned: 'red',
  closed: 'green',
  cancelled: 'default',
}

const APPROVAL_STEP_LABELS: Record<ApprovalStep, string> = {
  ai_analysis: 'AI分析',
  investigation: '调查',
  dept_head_review: '部门主管审核',
  cross_dept_head_review: '跨部门主管审核',
  qa_review: 'QA审核',
  qa_head_review: 'QA主管审核',
  quality_head_review: '质量主管审核',
  final_code_input: '最终编号输入',
}

const LEVEL_OPTIONS = [
  { label: '轻微', value: 'minor' },
  { label: '中等', value: 'moderate' },
  { label: '严重', value: 'major' },
]

const REASON_CATEGORY_OPTIONS = [
  { label: '人为因素', value: 'human_error' },
  { label: '设备故障', value: 'equipment_failure' },
  { label: '物料问题', value: 'material_issue' },
  { label: '工艺问题', value: 'process_issue' },
  { label: '环境问题', value: 'environment_issue' },
  { label: '文件问题', value: 'document_issue' },
  { label: '其他', value: 'other' },
]

export function DeviationDetail() {
  const router = useRouter()
  const params = useParams()
  const { message, modal } = App.useApp()

  const [deviation, setDeviation] = useState<DeviationDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm] = Form.useForm()

  const [investigationModalOpen, setInvestigationModalOpen] = useState(false)
  const [investigationForm] = Form.useForm()

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewForm] = Form.useForm()
  const [reviewStep, setReviewStep] = useState<ApprovalStep | null>(null)

  const [finalCodeModalOpen, setFinalCodeModalOpen] = useState(false)
  const [finalCodeForm] = Form.useForm()

  const loadData = useCallback(async () => {
    try {
      const data = await fetchDeviation(params.id as string)
      setDeviation(data)
    } catch (error: any) {
      message.error(error.message || '加载失败')
      router.push('/quality/deviations')
    } finally {
      setLoading(false)
    }
  }, [params.id, message, router])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchDeviation(params.id as string)
        if (!cancelled) setDeviation(data)
      } catch (error: any) {
        if (!cancelled) {
          message.error(error.message || '加载失败')
          router.push('/quality/deviations')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [params.id, message, router])

  const handleEdit = () => {
    if (!deviation) return
    editForm.setFieldsValue({
      title: deviation.title,
      department: deviation.department,
      discovery_date: deviation.discovery_date ? dayjs(deviation.discovery_date) : null,
      discovery_time: deviation.discovery_time,
      discovery_location: deviation.discovery_location,
      level: deviation.level,
      description: deviation.description,
      immediate_actions: deviation.immediate_actions,
    })
    setEditMode(true)
  }

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields()
      await updateDeviation(deviation!.id, {
        ...values,
        discovery_date: values.discovery_date?.toISOString(),
      })
      message.success('保存成功')
      setEditMode(false)
      loadData()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    }
  }

  const handleDelete = () => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除此偏差吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteDeviation(deviation!.id)
          message.success('删除成功')
          router.push('/quality/deviations')
        } catch (error: any) {
          message.error(error.message || '删除失败')
        }
      },
    })
  }

  const handleSubmitInvestigation = async () => {
    try {
      const values = await investigationForm.validateFields()
      await submitInvestigation(deviation!.id, {
        description: values.description,
        nonconformity_description: values.nonconformity_description,
        root_cause_analysis: values.root_cause_analysis,
        risk_assessment: values.risk_assessment,
        urgent_measures: values.urgent_measures,
      })
      message.success('调查报告已提交')
      setInvestigationModalOpen(false)
      investigationForm.resetFields()
      loadData()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    }
  }

  const handleOpenReview = (step: ApprovalStep) => {
    setReviewStep(step)
    reviewForm.resetFields()
    setReviewModalOpen(true)
  }

  const handleSubmitReview = async () => {
    try {
      const values = await reviewForm.validateFields()
      await submitReview(deviation!.id, {
        step: reviewStep!,
        result: values.result,
        content: values.content,
        reason_category: values.reason_category,
        deviation_level: values.deviation_level,
      })
      message.success('审核意见已提交')
      setReviewModalOpen(false)
      reviewForm.resetFields()
      loadData()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    }
  }

  const handleSubmitFinalCode = async () => {
    try {
      const values = await finalCodeForm.validateFields()
      await submitFinalCode(deviation!.id, values.final_code)
      message.success('最终编号已提交')
      setFinalCodeModalOpen(false)
      finalCodeForm.resetFields()
      loadData()
    } catch (error: any) {
      if (error.message) message.error(error.message)
    }
  }

  const handleResubmit = async () => {
    modal.confirm({
      title: '确认重新提交',
      content: '确定要重新提交此偏差吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await resubmitDeviation(deviation!.id)
          message.success('已重新提交')
          loadData()
        } catch (error: any) {
          message.error(error.message || '重新提交失败')
        }
      },
    })
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (!deviation) {
    return <div>未找到偏差</div>
  }

  const currentStep = ((): ApprovalStep | null => {
    const statusToStep: Partial<Record<DeviationStatus, ApprovalStep>> = {
      pending_ai_analysis: 'ai_analysis',
      pending_investigation: 'investigation',
      pending_dept_head_review: 'dept_head_review',
      pending_cross_dept_head_review: 'cross_dept_head_review',
      pending_qa_review: 'qa_review',
      pending_qa_head_review: 'qa_head_review',
      pending_quality_head_review: 'quality_head_review',
    }
    return statusToStep[deviation.status] || null
  })()

  const canEdit = deviation.status === 'draft' || deviation.status === 'returned'
  const canDelete = deviation.status === 'draft'

  return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/quality/deviations')}>
              返回
            </Button>
            <h2 style={{ margin: 0 }}>{deviation.deviation_code}</h2>
            <Tag color={STATUS_COLORS[deviation.status]}>
              {STATUS_LABELS[deviation.status]}
              {deviation.status === 'returned' && deviation.returned_step && ` (${APPROVAL_STEP_LABELS[deviation.returned_step]})`}
            </Tag>
          </Space>
          <Space>
            {canEdit && (
              <>
                {!editMode ? (
                  <Button icon={<EditOutlined />} onClick={handleEdit}>
                    编辑
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => setEditMode(false)}>取消</Button>
                    <Button type="primary" onClick={handleSaveEdit}>
                      保存
                    </Button>
                  </>
                )}
              </>
            )}
            {canDelete && (
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                删除
              </Button>
            )}
            {deviation.status === 'pending_investigation' && (
              <Button type="primary" icon={<SendOutlined />} onClick={() => setInvestigationModalOpen(true)}>
                提交调查报告
              </Button>
            )}
            {currentStep && currentStep !== 'investigation' && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleOpenReview(currentStep)}>
                提交审核意见
              </Button>
            )}
            {deviation.status === 'pending_final_code' && (
              <Button type="primary" onClick={() => setFinalCodeModalOpen(true)}>
                提交最终编号
              </Button>
            )}
            {deviation.status === 'returned' && (
              <Button icon={<RedoOutlined />} onClick={handleResubmit}>
                重新提交
              </Button>
            )}
          </Space>
        </div>

        {!editMode ? (
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="标题">{deviation.title}</Descriptions.Item>
              <Descriptions.Item label="部门">{deviation.department}</Descriptions.Item>
              <Descriptions.Item label="发现日期">
                {deviation.discovery_date ? dayjs(deviation.discovery_date).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发现时间">{deviation.discovery_time || '-'}</Descriptions.Item>
              <Descriptions.Item label="发现地点">{deviation.discovery_location || '-'}</Descriptions.Item>
              <Descriptions.Item label="偏差等级">
                {deviation.level ? LEVEL_OPTIONS.find(o => o.value === deviation.level)?.label || deviation.level : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="偏差描述" span={2}>
                {deviation.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="即时措施" span={2}>
                {deviation.immediate_actions || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="报告人">{deviation.reporter_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{deviation.handler || '-'}</Descriptions.Item>
              {deviation.final_code && (
                <Descriptions.Item label="最终编号">{deviation.final_code}</Descriptions.Item>
              )}
              {deviation.root_cause_category && (
                <Descriptions.Item label="原因类别">
                  {REASON_CATEGORY_OPTIONS.find(o => o.value === deviation.root_cause_category)?.label || deviation.root_cause_category}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        ) : (
          <Card title="编辑基本信息" style={{ marginBottom: 16 }}>
            <Form form={editForm} layout="vertical">
              <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="department" label="部门" rules={[{ required: true, message: '请输入部门' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="discovery_date" label="发现日期">
                <Input type="datetime-local" />
              </Form.Item>
              <Form.Item name="discovery_time" label="发现时间">
                <Input />
              </Form.Item>
              <Form.Item name="discovery_location" label="发现地点">
                <Input />
              </Form.Item>
              <Form.Item name="level" label="偏差等级">
                <Select options={LEVEL_OPTIONS} allowClear />
              </Form.Item>
              <Form.Item name="description" label="偏差描述">
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item name="immediate_actions" label="即时措施">
                <TextArea rows={3} />
              </Form.Item>
            </Form>
          </Card>
        )}

        {deviation.ai_analysis && (
          <Card title="AI分析结果" style={{ marginBottom: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="问题描述">{deviation.ai_analysis.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="原因分析">{deviation.ai_analysis.reason || '-'}</Descriptions.Item>
              <Descriptions.Item label="风险评估">{deviation.ai_analysis.riskAssessment || '-'}</Descriptions.Item>
              <Descriptions.Item label="CAPA建议">{deviation.ai_analysis.capaSuggestion || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {deviation.investigation_records && deviation.investigation_records.length > 0 && (
          <Card title="调查记录" style={{ marginBottom: 16 }}>
            {deviation.investigation_records.map((record, index) => (
              <div key={index} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: index < deviation.investigation_records!.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>调查人:</strong> {record.author}
                  <span style={{ marginLeft: 16, color: '#787671' }}>
                    {record.createTime ? dayjs(record.createTime).format('YYYY-MM-DD HH:mm') : '-'}
                  </span>
                </div>
                {record.nonconformityDescription && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>不符合事项:</strong>
                    <div>{record.nonconformityDescription}</div>
                  </div>
                )}
                {record.rootCauseAnalysis && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>根本原因分析:</strong>
                    <div>{record.rootCauseAnalysis}</div>
                  </div>
                )}
                {record.riskAssessment && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>风险评估:</strong>
                    <div>{record.riskAssessment}</div>
                  </div>
                )}
                {record.urgentMeasures && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>紧急措施:</strong>
                    <div>{record.urgentMeasures}</div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}

        {deviation.review_opinions && deviation.review_opinions.length > 0 && (
          <Card title="审核意见" style={{ marginBottom: 16 }}>
            {deviation.review_opinions.map((opinion, index) => (
              <div key={index} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: index < deviation.review_opinions!.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color={opinion.result === 'approved' ? 'green' : 'red'}>
                    {opinion.result === 'approved' ? '通过' : '退回'}
                  </Tag>
                  <strong>{APPROVAL_STEP_LABELS[opinion.step as ApprovalStep] || opinion.step}</strong>
                  <span style={{ marginLeft: 16, color: '#787671' }}>
                    {opinion.createTime ? dayjs(opinion.createTime).format('YYYY-MM-DD HH:mm') : '-'}
                  </span>
                </div>
                <div>
                  <strong>审核人:</strong> {opinion.author}
                </div>
                {opinion.content && (
                  <div style={{ marginTop: 8 }}>
                    <strong>意见:</strong>
                    <div>{opinion.content}</div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}

        <Modal
          title="提交调查报告"
          open={investigationModalOpen}
          onOk={handleSubmitInvestigation}
          onCancel={() => setInvestigationModalOpen(false)}
          width={700}
        >
          <Form form={investigationForm} layout="vertical">
            <Form.Item name="description" label="调查描述">
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item name="nonconformity_description" label="不符合事项描述">
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item name="root_cause_analysis" label="根本原因分析">
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item name="risk_assessment" label="风险评估">
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item name="urgent_measures" label="紧急措施">
              <TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`提交审核意见 - ${reviewStep ? APPROVAL_STEP_LABELS[reviewStep] : ''}`}
          open={reviewModalOpen}
          onOk={handleSubmitReview}
          onCancel={() => setReviewModalOpen(false)}
          width={600}
        >
          <Form form={reviewForm} layout="vertical">
            <Form.Item name="result" label="审核结果" rules={[{ required: true, message: '请选择审核结果' }]}>
              <Select>
                <Option value="approved">通过</Option>
                <Option value="rejected">退回</Option>
              </Select>
            </Form.Item>
            <Form.Item name="content" label="审核意见" rules={[{ required: true, message: '请输入审核意见' }]}>
              <TextArea rows={4} />
            </Form.Item>
            {reviewStep === 'qa_review' && (
              <Form.Item name="reason_category" label="原因类别">
                <Select options={REASON_CATEGORY_OPTIONS} allowClear />
              </Form.Item>
            )}
            {reviewStep === 'qa_head_review' && (
              <Form.Item name="deviation_level" label="偏差等级">
                <Select options={LEVEL_OPTIONS} allowClear />
              </Form.Item>
            )}
          </Form>
        </Modal>

        <Modal
          title="提交最终编号"
          open={finalCodeModalOpen}
          onOk={handleSubmitFinalCode}
          onCancel={() => setFinalCodeModalOpen(false)}
        >
          <Form form={finalCodeForm} layout="vertical">
            <Form.Item name="final_code" label="最终编号" rules={[{ required: true, message: '请输入最终编号' }]}>
              <Input placeholder="例如：DEV-2024-001" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
  )
}
