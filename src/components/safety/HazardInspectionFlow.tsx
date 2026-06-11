'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Steps,
  Button,
  Space,
  Typography,
  App,
  Drawer,
  Tag,
  Empty,
  Spin,
  Result,
  Card,
  Divider,
} from 'antd'
import {
  CheckCircleOutlined,
  LoadingOutlined,
  RobotOutlined,
  EditOutlined,
  FileTextOutlined,
  InboxOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import HazardInspectionForm from './HazardInspectionForm'
import type { InspectionFormValues } from './HazardInspectionForm'
import HazardAIResultPanel from './HazardAIResultPanel'
import {
  createHazard,
  updateHazard,
  getHazards,
  runHazardAI,
  reviewHazardAI,
  deleteHazard,
} from '@/actions/safety'
import type { HazardReport, HazardReportFormData } from '@/types/safety'
import dayjs from 'dayjs'

const { Text, Title } = Typography

type FlowStep = 'form' | 'analyzing' | 'review' | 'done'

export default function HazardInspectionFlow() {
  const router = useRouter()
  const { message, modal } = App.useApp()

  // ── 流程状态 ──
  const [currentStep, setCurrentStep] = useState<FlowStep>('form')
  const [currentHazard, setCurrentHazard] = useState<HazardReport | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [aiProgress, setAiProgress] = useState<'idle' | 'script1' | 'script2' | 'done' | 'error'>('idle')

  // ── 草稿箱状态 ──
  const [draftDrawerOpen, setDraftDrawerOpen] = useState(false)
  const [drafts, setDrafts] = useState<HazardReport[]>([])
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [draftFormValues, setDraftFormValues] = useState<InspectionFormValues | undefined>()

  // ── 已完成状态 ──
  const [completedHazardNo, setCompletedHazardNo] = useState('')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  // 加载草稿列表
  const loadDrafts = useCallback(async () => {
    setDraftsLoading(true)
    try {
      const res = await getHazards({
        overall_status: 'draft',
        page_size: 50,
      })
      if (res.code === 200) {
        setDrafts(res.data)
      }
    } catch {
      // 静默失败
    } finally {
      setDraftsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  // ── 提交隐患 → 创建/更新记录 + 上传图片 + 触发AI ──
  const handleSubmit = async (values: InspectionFormValues, files: File[]) => {
    setSubmitting(true)
    try {
      let hazard: HazardReport

      if (currentHazard) {
        // 从草稿继续 → 更新已有记录
        const updateRes = await updateHazard(currentHazard.id, {
          inspection_category: values.inspection_category,
          location: values.location,
          discovered_by_name: values.discovered_by_name,
          department: values.department,
          discovered_at: values.discovered_at,
          description: values.description,
          overall_status: 'draft', // 保持草稿状态，等AI完成后入库
        } as HazardReportFormData)
        if (updateRes.code !== 200) {
          message.error(updateRes.message || '更新失败')
          setSubmitting(false)
          return
        }
        hazard = updateRes.data as HazardReport
      } else {
        // 新建记录
        const createRes = await createHazard({
          hazard_no: '',
          inspection_category: values.inspection_category,
          location: values.location,
          discovered_by_name: values.discovered_by_name,
          department: values.department,
          discovered_at: values.discovered_at,
          description: values.description,
        } as HazardReportFormData)
        if (createRes.code !== 200) {
          message.error(createRes.message || '创建失败')
          setSubmitting(false)
          return
        }
        hazard = createRes.data as HazardReport
      }

      setCurrentHazard(hazard)

      // 上传图片
      if (files.length > 0) {
        for (const file of files) {
          try {
            const formData = new FormData()
            formData.append('file', file)
            await fetch(`${API_BASE}/safety/hazards/${hazard.id}/upload-photo`, {
              method: 'POST',
              body: formData,
            })
          } catch {
            console.error('图片上传失败')
          }
        }
      }

      // 进入AI分析阶段
      setCurrentStep('analyzing')
      setAiProgress('script1')

      // 执行 AI Step 1
      const r1 = await runHazardAI(hazard.id, 1)
      if (r1.code !== 200) {
        message.warning('AI 识别失败：' + (r1.message || '未知错误'))
        setAiProgress('error')
        // 仍然允许进入 review 步骤（用户可手动填写）
        const updated = await refreshHazard(hazard.id)
        setCurrentHazard(updated)
        setCurrentStep('review')
        return
      }

      setAiProgress('script2')

      // 执行 AI Step 2
      const r2 = await runHazardAI(hazard.id, 2)
      if (r2.code !== 200) {
        message.warning('AI 整改建议生成失败：' + (r2.message || '未知错误'))
        setAiProgress('error')
      } else {
        setAiProgress('done')
      }

      // 刷新数据并进入审核
      const updated = await refreshHazard(hazard.id)
      setCurrentHazard(updated)
      setCurrentStep('review')
    } catch (err) {
      console.error('提交失败:', err)
      message.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // ── 保存草稿 ──
  const handleSaveDraft = async (values: InspectionFormValues, files: File[]) => {
    setSubmitting(true)
    try {
      let hazard: HazardReport

      if (currentHazard) {
        // 从草稿继续 → 更新已有记录
        const updateRes = await updateHazard(currentHazard.id, {
          inspection_category: values.inspection_category,
          location: values.location,
          discovered_by_name: values.discovered_by_name,
          department: values.department,
          discovered_at: values.discovered_at,
          description: values.description,
          overall_status: 'draft',
        } as HazardReportFormData)
        if (updateRes.code !== 200) {
          message.error(updateRes.message || '保存草稿失败')
          return
        }
        hazard = updateRes.data as HazardReport
      } else {
        // 新建草稿
        const createRes = await createHazard({
          hazard_no: '',
          inspection_category: values.inspection_category,
          location: values.location,
          discovered_by_name: values.discovered_by_name,
          department: values.department,
          discovered_at: values.discovered_at,
          description: values.description,
          overall_status: 'draft',
        } as HazardReportFormData)
        if (createRes.code !== 200) {
          message.error(createRes.message || '保存草稿失败')
          return
        }
        hazard = createRes.data as HazardReport
      }

      // 上传图片
      if (files.length > 0) {
        for (const file of files) {
          try {
            const formData = new FormData()
            formData.append('file', file)
            await fetch(`${API_BASE}/safety/hazards/${hazard.id}/upload-photo`, {
              method: 'POST',
              body: formData,
            })
          } catch {
            // 静默失败
          }
        }
      }

      message.success('草稿已保存')
      await loadDrafts()
      // 重置为初始状态
      setCurrentStep('form')
      setCurrentHazard(null)
      setDraftFormValues(undefined)
    } catch {
      message.error('保存草稿失败')
    } finally {
      setSubmitting(false)
    }
  }

  // ── 确认入库 ──
  const handleConfirm = async (edits: Partial<Record<string, string>>) => {
    if (!currentHazard) return
    setConfirming(true)
    try {
      // 如果有编辑，先更新字段
      if (Object.keys(edits).length > 0) {
        const updateRes = await updateHazard(currentHazard.id, edits as any)
        if (updateRes.code !== 200) {
          message.error(updateRes.message || '更新失败')
          setConfirming(false)
          return
        }
      }

      // 审核通过（入库）
      const reviewRes = await reviewHazardAI(currentHazard.id, 0, 'approved')
      if (reviewRes.code === 200) {
        message.success('隐患已确认入库！')
        setCompletedHazardNo(currentHazard.hazard_no)
        setCurrentStep('done')
      } else {
        message.error(reviewRes.message || '确认失败')
      }
    } catch {
      message.error('确认操作失败')
    } finally {
      setConfirming(false)
    }
  }

  // ── 重新AI分析 ──
  const handleRerun = async () => {
    if (!currentHazard) return
    setCurrentStep('analyzing')
    setAiProgress('script1')

    try {
      const r1 = await runHazardAI(currentHazard.id, 1)
      if (r1.code !== 200) {
        message.warning('AI 识别失败：' + (r1.message || ''))
        setAiProgress('error')
        const updated = await refreshHazard(currentHazard.id)
        setCurrentHazard(updated)
        setCurrentStep('review')
        return
      }

      setAiProgress('script2')
      const r2 = await runHazardAI(currentHazard.id, 2)
      if (r2.code !== 200) {
        message.warning('AI 整改建议生成失败：' + (r2.message || ''))
        setAiProgress('error')
      } else {
        setAiProgress('done')
      }

      const updated = await refreshHazard(currentHazard.id)
      setCurrentHazard(updated)
      setCurrentStep('review')
    } catch {
      message.error('AI 重新执行失败')
      setCurrentStep('review')
    }
  }

  // ── 刷新隐患数据 ──
  const refreshHazard = async (id: string): Promise<HazardReport | null> => {
    const res = await fetch(`${API_BASE}/safety/hazards/${id}`)
    if (res.ok) {
      const json = await res.json()
      return json.data || json
    }
    return null
  }

  // ── 从草稿继续登记 ──
  const handleContinueDraft = (draft: HazardReport) => {
    setDraftFormValues({
      inspection_category: draft.inspection_category,
      location: draft.location,
      discovered_by_name: draft.discovered_by_name,
      department: draft.department,
      discovered_at: draft.discovered_at,
      description: draft.description,
    })
    setCurrentHazard(draft)
    setDraftDrawerOpen(false)
    setCurrentStep('form')
  }

  // ── 删除草稿 ──
  const handleDeleteDraft = async (id: string) => {
    try {
      const res = await deleteHazard(id)
      if (res.code === 200) {
        message.success('草稿已删除')
        await loadDrafts()
      } else {
        message.error(res.message || '删除失败')
      }
    } catch {
      message.error('删除失败')
    }
  }

  // ── 开始新登记 ──
  const handleNewInspection = () => {
    setCurrentStep('form')
    setCurrentHazard(null)
    setDraftFormValues(undefined)
    setCompletedHazardNo('')
    setAiProgress('idle')
  }

  // ── 步骤条配置 ──
  const stepItems = [
    { title: '登记信息', icon: <EditOutlined /> },
    { title: 'AI分析', icon: <RobotOutlined /> },
    { title: '确认结果', icon: <CheckCircleOutlined /> },
    { title: '完成', icon: <FileTextOutlined /> },
  ]

  const currentStepIndex =
    currentStep === 'form'
      ? 0
      : currentStep === 'analyzing'
        ? 1
        : currentStep === 'review'
          ? 2
          : 3

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* ── 页头 ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
              隐患排查
            </h1>
            <Text style={{ color: '#5d5b54' }}>隐患登记与AI智能分析</Text>
          </div>
          <Space>
            <Button icon={<InboxOutlined />} onClick={() => { loadDrafts(); setDraftDrawerOpen(true) }}>
              草稿箱
              {drafts.length > 0 && (
                <Tag color="blue" style={{ marginLeft: 8, borderRadius: 10 }}>
                  {drafts.length}
                </Tag>
              )}
            </Button>
          </Space>
        </div>
      </div>

      {/* ── 步骤条 ── */}
      <Card style={{ borderRadius: 12, border: '1px solid #e5e3df', marginBottom: 24 }}>
        <Steps
          current={currentStepIndex}
          size="small"
          items={stepItems.map((item, i) => ({
            title: item.title,
            icon:
              currentStepIndex > i ? (
                <CheckCircleOutlined />
              ) : currentStepIndex === i && currentStep === 'analyzing' ? (
                <LoadingOutlined />
              ) : (
                item.icon
              ),
          }))}
        />
      </Card>

      {/* ── Step 1: 登记表单 ── */}
      {currentStep === 'form' && (
        <HazardInspectionForm
          key={currentHazard?.id || 'new'}
          initialValues={draftFormValues}
          loading={submitting}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {/* ── Step 2: AI 分析中 ── */}
      {currentStep === 'analyzing' && (
        <Card
          style={{ borderRadius: 12, border: '1px solid #e5e3df', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}
        >
          <Spin size="large" />
          <div style={{ marginTop: 24 }}>
            <Title level={4}>
              🤖 AI 正在分析中...
            </Title>
            <Space orientation="vertical" size="middle" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {aiProgress === 'script1' ? (
                  <LoadingOutlined style={{ color: '#722ed1' }} />
                ) : aiProgress === 'script2' || aiProgress === 'done' ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : aiProgress === 'error' ? (
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                ) : null}
                <Text>
                  {aiProgress === 'script1'
                    ? '正在识别隐患信息（Step 1）...'
                    : aiProgress === 'script2'
                      ? '正在生成整改建议（Step 2）...'
                      : aiProgress === 'done'
                        ? 'AI 分析完成'
                        : aiProgress === 'error'
                          ? 'AI 分析遇到问题'
                          : '准备中...'}
                </Text>
              </div>
            </Space>
            {currentHazard && (
              <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                编号：{currentHazard.hazard_no}
              </Text>
            )}
          </div>
        </Card>
      )}

      {/* ── Step 3: AI 结果确认 ── */}
      {currentStep === 'review' && currentHazard && (
        <HazardAIResultPanel
          hazard={currentHazard}
          confirming={confirming}
          onConfirm={handleConfirm}
          onRerun={handleRerun}
        />
      )}

      {/* ── Step 4: 完成 ── */}
      {currentStep === 'done' && (
        <Card
          style={{ borderRadius: 12, border: '1px solid #e5e3df', maxWidth: 600, margin: '0 auto' }}
        >
          <Result
            status="success"
            title="隐患已确认入库！"
            subTitle={`编号：${completedHazardNo || currentHazard?.hazard_no || ''}`}
            extra={[
              <Button
                type="primary"
                key="ledger"
                onClick={() => router.push('/safety/hazard-ledger')}
              >
                前往台账查看
              </Button>,
              <Button key="new" onClick={handleNewInspection}>
                继续登记新隐患
              </Button>,
            ]}
          />
        </Card>
      )}

      {/* ── 草稿箱抽屉 ── */}
      <Drawer
        title={
          <Space>
            <InboxOutlined />
            <span>草稿箱</span>
            <Tag color="blue">{drafts.length}</Tag>
          </Space>
        }
        open={draftDrawerOpen}
        onClose={() => setDraftDrawerOpen(false)}
        size={420}
      >
        {draftsLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : drafts.length === 0 ? (
          <Empty description="暂无草稿记录" />
        ) : (
          <div>
            {drafts.map((draft, idx) => (
              <div key={draft.id}>
                {idx > 0 && <Divider style={{ margin: '8px 0' }} />}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Space style={{ marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 13 }}>
                        {draft.hazard_no || '未编号'}
                      </Text>
                      {draft.inspection_category && (
                        <Tag>{draft.inspection_category}</Tag>
                      )}
                    </Space>
                    <div style={{ fontSize: 12 }}>
                      {draft.location && (
                        <Text type="secondary" style={{ display: 'block' }}>
                          📍 {draft.location}
                        </Text>
                      )}
                      {draft.department && (
                        <Text type="secondary" style={{ display: 'block' }}>
                          🏢 {draft.department}
                        </Text>
                      )}
                      <Text type="secondary" style={{ display: 'block' }}>
                        🕐{' '}
                        {draft.created_at
                          ? dayjs(draft.created_at).format('YYYY-MM-DD HH:mm')
                          : '-'}
                      </Text>
                    </div>
                  </div>
                  <Space style={{ flexShrink: 0, marginLeft: 12 }}>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleContinueDraft(draft)}
                    >
                      继续登记
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteDraft(draft.id)}
                    />
                  </Space>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  )
}
