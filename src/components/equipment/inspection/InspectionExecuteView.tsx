'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  App, Button, Card, Form, Input, Progress, Radio, Select, Steps, Typography,
} from 'antd'
import {
  ArrowLeftOutlined, CheckOutlined, CameraOutlined, AimOutlined, RobotOutlined, EnvironmentOutlined,
} from '@ant-design/icons'
import { useInspectionStore } from '@/stores/inspection'
import { submitEquipmentCheck, uploadInspectionPhoto, completeInspectionTask, analyzeInspectionPhoto, submitRouteCheck, uploadTaskPhoto } from '@/actions/inspection'
import type { InspectionRecordItem, InspectionAIItemResult } from '@/types/inspection'
import type { InspectionTemplateItem } from '@/types/equipment'

const { Text } = Typography

interface Props { onClose: () => void }

interface VEq { equipment_id: string; equipment_name: string; equipment_no?: string }

export function InspectionExecuteView({ onClose }: Props) {
  const { message, modal } = App.useApp()
  const {
    executingTaskId, executingPlanType, executingRouteDetail, executingTemplateItems, executingTemplateName,
    executingEquipmentId, executingEquipmentName, executingEquipmentNo,
    executingEquipmentIds, executingEquipments,
    clearExecuting,
  } = useInspectionStore()

  const routeEqs = executingRouteDetail?.equipments || []
  const routeName = executingRouteDetail?.name || ''
  const routeDeviceNames = routeEqs.map(eq => eq.equipment_name || eq.equipment_no || '设备').join('、')

  // ── 设备巡检模式 ──
  if (executingPlanType !== '线路巡检') {
    return <DeviceInspectionView onClose={onClose} />
  }

  // ── 线路巡检模式 ──
  const [photos, setPhotos] = useState<File[]>([])
  const [overallResult, setOverallResult] = useState<string>('正常')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const addPhoto = useCallback((f: File) => {
    setPhotos(prev => [...prev, f])
  }, [])
  const rmPhoto = useCallback((i: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
  }, [])

  // 管理 Blob URL 生命周期，避免内存泄漏
  const photoUrls = useMemo(() => photos.map(f => URL.createObjectURL(f)), [photos])
  useEffect(() => {
    return () => { photoUrls.forEach(u => URL.revokeObjectURL(u)) }
  }, [photoUrls])

  const pickFile = () => {
    const inp = document.createElement('input')
    inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment'
    inp.onchange = e => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (f) addPhoto(f)
    }
    inp.click()
  }

  const handleSubmit = useCallback(async () => {
    if (!executingTaskId) return
    modal.confirm({
      title: '提交线路巡检',
      content: `确认提交巡检结果？总体判断：${overallResult}`,
      okText: '确认提交', cancelText: '取消',
      onOk: async () => {
        setSubmitting(true)
        try {
          // 1. 上传照片（任务级）
          for (const f of photos) {
            const fd = new FormData(); fd.append('file', f)
            await uploadTaskPhoto(executingTaskId, fd)
          }
          // 2. 提交巡检结果
          await submitRouteCheck(executingTaskId, {
            overall_result: overallResult as '正常' | '异常',
            route_summary: summary || undefined,
          })
          message.success('线路巡检已完成')
          clearExecuting(); onClose()
        } catch (err: unknown) {
          message.error((err as Error).message || '提交失败')
        } finally { setSubmitting(false) }
      },
    })
  }, [executingTaskId, photos, overallResult, summary, clearExecuting, onClose, message, modal])

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 0 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <Button icon={<ArrowLeftOutlined />} onClick={onClose} style={{ borderRadius: 8, marginBottom: 12, fontWeight: 500 }}>
            返回任务列表
          </Button>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', margin: 0, lineHeight: 1.3 }}>
            线路巡检
            <span style={{ fontWeight: 400, fontSize: 16, color: '#787671', marginLeft: 12 }}>
              {executingTemplateName}
            </span>
          </h2>
        </div>
      </div>

      {/* 路线信息卡片 */}
      <div style={{
        padding: '18px 24px', marginBottom: 24,
        background: '#e6e0f5', borderRadius: 12,
        border: '1px solid #d6b6f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <EnvironmentOutlined style={{ fontSize: 24, color: '#7b3ff2' }} />
          <div>
            <Text strong style={{ fontSize: 15, color: '#391c57', display: 'block', marginBottom: 4 }}>
              巡检线路：{routeName}
            </Text>
            {routeDeviceNames && (
              <Text style={{ fontSize: 13, color: '#7b3ff2' }}>
                包含设备：{routeDeviceNames}
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* 现场照片 */}
      <div style={{
        padding: 20, marginBottom: 24,
        background: photos.length === 0 ? '#fef7d6' : '#fafaf9',
        borderRadius: 10,
        border: photos.length === 0 ? '2px dashed #f5d75e' : '1px solid #d9f3e1',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: photos.length > 0 ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CameraOutlined style={{ fontSize: 16, color: photos.length === 0 ? '#dd5b00' : '#1aae39' }} />
            <Text strong style={{ fontSize: 14 }}>现场照片</Text>
            {photos.length > 0 && (
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#1aae39', background: '#d9f3e1' }}>
                {photos.length} 张
              </span>
            )}
          </div>
          <Button size="small" icon={<CameraOutlined />} onClick={pickFile} style={{ borderRadius: 8, fontWeight: 500 }}>
            拍照/上传
          </Button>
        </div>
        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {photos.map((f, i) => (
              <div key={i} style={{
                position: 'relative', width: 88, height: 88,
                borderRadius: 8, overflow: 'hidden',
                border: '1px solid #e5e3df',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <img src={photoUrls[i]} alt={`现场照片-${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span role="button" onClick={() => rmPhoto(i)} style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 20, height: 20, borderRadius: 10,
                  background: 'rgba(224,49,49,0.88)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 12, lineHeight: 1, fontWeight: 600,
                }}>✕</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 巡检结果 */}
      <div style={{
        padding: 24, marginBottom: 24,
        background: '#fff', borderRadius: 12,
        border: '1px solid #e5e3df',
      }}>
        <Text strong style={{ fontSize: 14, color: '#37352f', display: 'block', marginBottom: 16 }}>
          巡检结果
        </Text>
        <div style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, color: '#5d5b54', display: 'block', marginBottom: 8 }}>总体判断</Text>
          <Radio.Group
            value={overallResult}
            onChange={e => setOverallResult(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button
              value="正常"
              style={{
                borderRadius: '6px 0 0 6px',
                borderColor: overallResult === '正常' ? '#1aae39' : '#d9d9d9',
                color: overallResult === '正常' ? '#fff' : '#5d5b54',
                background: overallResult === '正常' ? '#1aae39' : '#fff',
                fontWeight: 600,
              }}
            >
              正常
            </Radio.Button>
            <Radio.Button
              value="异常"
              style={{
                borderRadius: '0 6px 6px 0',
                borderColor: overallResult === '异常' ? '#e03131' : '#d9d9d9',
                color: overallResult === '异常' ? '#fff' : '#5d5b54',
                background: overallResult === '异常' ? '#e03131' : '#fff',
                fontWeight: 600,
              }}
            >
              异常
            </Radio.Button>
          </Radio.Group>
        </div>
        <div>
          <Text style={{ fontSize: 13, color: '#5d5b54', display: 'block', marginBottom: 8 }}>现场描述</Text>
          <Input.TextArea
            rows={4}
            placeholder="描述巡检现场情况，如设备运行状态、异常情况说明等..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
            style={{ borderRadius: 8 }}
          />
        </div>
      </div>

      {/* 提交 */}
      <div style={{ textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          icon={<CheckOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          style={{
            borderRadius: 8, height: 44, paddingInline: 32, fontWeight: 600,
            background: '#5645d4', borderColor: '#5645d4',
            fontSize: 15,
          }}
        >
          提交巡检
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// DeviceInspectionView — 设备巡检模式（保持原有逻辑）
// ═══════════════════════════════════════════

function DeviceInspectionView({ onClose }: Props) {
  const { message, modal } = App.useApp()
  const {
    executingTaskId, executingRouteDetail, executingTemplateItems, executingTemplateName,
    executingEquipmentId, executingEquipmentName, executingEquipmentNo,
    executingEquipmentIds, executingEquipments, executingCompletedEquipmentIds,
    clearExecuting,
  } = useInspectionStore()

  const equipments: VEq[] = useMemo(() => {
    const routeEqs = executingRouteDetail?.equipments || []
    if (routeEqs.length > 0) {
      return routeEqs.map(eq => ({
        equipment_id: eq.equipment_id,
        equipment_name: eq.equipment_name || eq.equipment_no || '设备',
        equipment_no: eq.equipment_no,
      }))
    }
    if (executingEquipmentIds && executingEquipmentIds.length > 0) {
      const map = new Map(executingEquipments.map(e => [e.id, e]))
      return executingEquipmentIds.map(id => {
        const info = map.get(id)
        return { equipment_id: id, equipment_name: info?.name || id.slice(0, 8) + '…', equipment_no: info?.no }
      })
    }
    if (executingEquipmentId) {
      return [{ equipment_id: executingEquipmentId, equipment_name: executingEquipmentName || executingEquipmentNo || '设备', equipment_no: executingEquipmentNo }]
    }
    return []
  }, [executingRouteDetail, executingEquipmentId, executingEquipmentName, executingEquipmentNo, executingEquipmentIds, executingEquipments])

  const initialDone = useMemo(() => new Set(executingCompletedEquipmentIds || []), [executingCompletedEquipmentIds])
  const initialStep = useMemo(() => {
    const idx = equipments.findIndex(eq => !initialDone.has(eq.equipment_id))
    return idx >= 0 ? idx : 0
  }, [equipments, initialDone])
  const [step, setStep] = useState(initialStep)
  const [done, setDone] = useState<Set<string>>(initialDone)
  const [submitting, setSubmitting] = useState(false)
  const [photos, setPhotos] = useState<Record<string, File[]>>({})

  const cur = equipments[step]
  const doneN = done.size
  const total = equipments.length
  const pct = total > 0 ? Math.round((doneN / total) * 100) : 0
  const multi = total > 1

  const submitCheck = useCallback(async (records: InspectionRecordItem[]) => {
    if (!executingTaskId || !cur) return
    try {
      await submitEquipmentCheck(executingTaskId, cur.equipment_id, { records })
      for (const f of photos[cur.equipment_id] || []) {
        const fd = new FormData(); fd.append('file', f)
        await uploadInspectionPhoto(executingTaskId, cur.equipment_id, fd)
      }
      setDone(prev => new Set(prev).add(cur.equipment_id))
      message.success(`${cur.equipment_name} 检查完成`)
      if (step < total - 1) setStep(step + 1)
    } catch (err: unknown) {
      message.error((err as Error).message || '提交失败')
    }
  }, [executingTaskId, cur, step, total, photos, message])

  const finish = useCallback(() => {
    if (!executingTaskId) return
    const left = total - doneN
    modal.confirm({
      title: '提交巡检',
      content: left > 0
        ? `还有 ${left} 台设备未检查（已完成 ${doneN}/${total}），确定提交吗？`
        : `全部 ${total} 台设备已检查完成，确认提交？`,
      okText: '确认提交', cancelText: '取消',
      onOk: async () => {
        setSubmitting(true)
        try {
          await completeInspectionTask(executingTaskId)
          message.success('巡检任务已完成')
          clearExecuting(); onClose()
        } catch (err: unknown) {
          message.error((err as Error).message || '提交失败')
        } finally { setSubmitting(false) }
      },
    })
  }, [executingTaskId, doneN, total, clearExecuting, onClose, message, modal])

  const addPhoto = useCallback((eqId: string, file: File) => {
    setPhotos(prev => ({ ...prev, [eqId]: [...(prev[eqId] || []), file] }))
  }, [])
  const rmPhoto = useCallback((eqId: string, idx: number) => {
    setPhotos(prev => ({ ...prev, [eqId]: (prev[eqId] || []).filter((_, i) => i !== idx) }))
  }, [])

  if (equipments.length === 0) {
    return (
      <div style={{ maxWidth: 480, margin: '120px auto', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 20 }}>
          无法获取巡检设备信息
        </Text>
        <Button icon={<ArrowLeftOutlined />} onClick={onClose} style={{ borderRadius: 8 }}>返回</Button>
      </div>
    )
  }

  const curPhotos = photos[cur?.equipment_id || ''] || []

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 0 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <Button icon={<ArrowLeftOutlined />} onClick={onClose} style={{ borderRadius: 8, marginBottom: 12, fontWeight: 500 }}>
            返回任务列表
          </Button>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', margin: 0, lineHeight: 1.3 }}>
            设备巡检
            <span style={{ fontWeight: 400, fontSize: 16, color: '#787671', marginLeft: 12 }}>
              {executingTemplateName}
            </span>
          </h2>
        </div>
      </div>

      {/* 引导卡片 */}
      <div style={{
        padding: '18px 24px', marginBottom: 24,
        background: '#e6e0f5', borderRadius: 12,
        border: '1px solid #d6b6f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <AimOutlined style={{ fontSize: 24, color: '#7b3ff2' }} />
          <div>
            <Text strong style={{ fontSize: 15, color: '#391c57', display: 'block', marginBottom: 2 }}>
              {multi
                ? `第 ${step + 1} 步 / 共 ${total} 步 — 请对下方设备逐项检查并拍照`
                : '请对下方设备逐项检查并拍照，完成后提交巡检'}
            </Text>
            <Text style={{ fontSize: 13, color: '#7b3ff2' }}>
              每台设备至少拍摄一张现场照片 · 逐项标记检查结果 · 异常项请备注说明
            </Text>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', marginBottom: multi ? 16 : 24,
        background: '#fafaf9', borderRadius: 12,
        border: '1px solid #ede9e4',
      }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>进度</Text>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.1, marginTop: 2 }}>
            {doneN}<span style={{ fontSize: 16, fontWeight: 400, color: '#a4a097' }}> / {total}</span>
          </div>
        </div>
        <Progress
          type="circle" percent={pct} size={64}
          strokeColor={pct === 100 ? '#1aae39' : '#5645d4'}
          railColor="#e5e3df"
        />
      </div>

      {/* Steps */}
      {multi && (
        <div style={{
          padding: '12px 24px', marginBottom: 24,
          background: '#fff', borderRadius: 12, border: '1px solid #ede9e4',
        }}>
          <Steps
            current={step} size="small"
            items={equipments.map((eq, i) => ({
              title: eq.equipment_name,
              status: done.has(eq.equipment_id) ? 'finish' as const : i === step ? 'process' as const : 'wait' as const,
            }))}
          />
        </div>
      )}

      {/* 当前设备检查卡 */}
      {cur && (
        <EquipmentCheckCard
          key={cur.equipment_id}
          equipmentId={cur.equipment_id}
          equipmentName={cur.equipment_name}
          equipmentNo={cur.equipment_no}
          templateItems={executingTemplateItems}
          photos={curPhotos}
          onAddPhoto={f => addPhoto(cur.equipment_id, f)}
          onRemovePhoto={i => rmPhoto(cur.equipment_id, i)}
          onSubmit={submitCheck}
          disabled={done.has(cur.equipment_id)}
        />
      )}

      {/* 底部提交 */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          icon={<CheckOutlined />}
          onClick={finish}
          loading={submitting}
          style={{
            borderRadius: 8, height: 44, paddingInline: 32, fontWeight: 600,
            background: pct === 100 ? '#1aae39' : '#5645d4',
            borderColor: pct === 100 ? '#1aae39' : '#5645d4',
            fontSize: 15,
          }}
        >
          {pct === 100 ? '提交巡检' : `提交巡检（已完成 ${doneN}/${total}）`}
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// EquipmentCheckCard — 单设备检查卡片
// ═══════════════════════════════════════════

interface CardProps {
  equipmentId: string
  equipmentName: string
  equipmentNo?: string
  templateItems: InspectionTemplateItem[]
  photos: File[]
  onAddPhoto: (f: File) => void
  onRemovePhoto: (i: number) => void
  onSubmit: (records: InspectionRecordItem[]) => Promise<void>
  disabled?: boolean
}

function EquipmentCheckCard({
  equipmentId, equipmentName, equipmentNo, templateItems, photos,
  onAddPhoto, onRemovePhoto, onSubmit, disabled,
}: CardProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // 管理 Blob URL 生命周期，避免内存泄漏
  const photoUrls = useMemo(() => photos.map((f: File) => URL.createObjectURL(f)), [photos])
  useEffect(() => {
    return () => { photoUrls.forEach((u: string) => URL.revokeObjectURL(u)) }
  }, [photoUrls])

  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields()
      const records: InspectionRecordItem[] = (vals.records || []).map(
        (row: { result?: string; actual_value?: string; remark?: string }, i: number) => ({
          template_item_id: templateItems[i].id,
          result: row.result || '正常',
          actual_value: row.actual_value,
          remark: row.remark,
        }),
      )
      setLoading(true)
      await onSubmit(records)
      form.resetFields()
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown[] })?.errorFields) return
      message.error((err as Error).message || '提交失败')
    } finally { setLoading(false) }
  }

  const handleAIAnalyze = async () => {
    const { executingTaskId: taskId } = useInspectionStore.getState()
    if (!taskId) {
      message.error('任务信息丢失，无法进行 AI 分析')
      return
    }
    if (photos.length === 0) {
      message.warning('请先拍摄到位照片')
      return
    }
    setAiLoading(true)
    try {
      const file = photos[0]
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1] || result
          resolve(base64)
        }
        reader.onerror = () => reject(new Error('图片读取失败'))
        reader.readAsDataURL(file)
      })

      const results = await analyzeInspectionPhoto(
        taskId,
        equipmentId,
        imageBase64,
        file.type || 'image/jpeg',
      )

      const formValues: Record<string, Array<{ result: string; actual_value?: string; remark?: string }>> = {
        records: templateItems.map((item) => {
          const aiResult = results.find(
            (r: InspectionAIItemResult) => r.template_item_id === item.id
          )
          if (aiResult) {
            return {
              result: aiResult.result,
              actual_value: aiResult.actual_value ?? undefined,
              remark: aiResult.remark ?? undefined,
            }
          }
          return { result: '正常', actual_value: undefined, remark: undefined }
        }),
      }
      form.setFieldsValue(formValues)

      const skipCount = results.filter((r: InspectionAIItemResult) => r.result === '跳过').length
      if (skipCount > 0) {
        message.success(`AI 分析完成，${skipCount} 项无法识别，已标记为"跳过"，请手动确认`)
      } else {
        message.success('AI 分析完成，请确认结果后提交')
      }
    } catch (err: unknown) {
      message.error((err as Error).message || 'AI 分析失败')
    } finally {
      setAiLoading(false)
    }
  }

  const pickFile = () => {
    const inp = document.createElement('input')
    inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment'
    inp.onchange = e => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (f) onAddPhoto(f)
    }
    inp.click()
  }

  const noPhoto = photos.length === 0

  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid #e5e3df',
      overflow: 'hidden',
    }}>
      {/* 设备标题栏 */}
      <div style={{
        padding: '14px 24px',
        background: '#0a1530',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <Text strong style={{ fontSize: 17, color: '#fff' }}>{equipmentName}</Text>
          {equipmentNo && (
            <span style={{
              padding: '2px 8px', borderRadius: 4,
              fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
              color: '#a4a097', background: 'rgba(255,255,255,0.12)',
            }}>
              {equipmentNo}
            </span>
          )}
        </div>
        {disabled && (
          <span style={{
            padding: '2px 10px', borderRadius: 4,
            fontSize: 12, fontWeight: 600,
            color: '#1aae39', background: 'rgba(26,174,57,0.15)',
          }}>
            已完成
          </span>
        )}
      </div>

      <div style={{ padding: 24 }}>
        {/* 到位照片 */}
        <div style={{
          padding: 20, marginBottom: 24,
          background: noPhoto ? '#fef7d6' : '#fafaf9',
          borderRadius: 10,
          border: noPhoto ? '2px dashed #f5d75e' : '1px solid #d9f3e1',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: photos.length > 0 ? 14 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CameraOutlined style={{ fontSize: 16, color: noPhoto ? '#dd5b00' : '#1aae39' }} />
              <Text strong style={{ fontSize: 14 }}>到位照片</Text>
              {!noPhoto && (
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#1aae39', background: '#d9f3e1' }}>
                  {photos.length} 张
                </span>
              )}
              {noPhoto && (
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#dd5b00', background: '#ffe8d4' }}>
                  待拍照
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                size="small"
                icon={<RobotOutlined />}
                onClick={handleAIAnalyze}
                loading={aiLoading}
                disabled={disabled || photos.length === 0}
                style={{ borderRadius: 8, fontWeight: 500 }}
              >
                AI分析
              </Button>
              <Button size="small" icon={<CameraOutlined />} onClick={pickFile} disabled={disabled} style={{ borderRadius: 8, fontWeight: 500 }}>
                拍照
              </Button>
            </div>
          </div>
          {!noPhoto && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {photos.map((f, i) => (
                <div key={i} style={{
                  position: 'relative', width: 88, height: 88,
                  borderRadius: 8, overflow: 'hidden',
                  border: '1px solid #e5e3df',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <img src={photoUrls[i]} alt={`${equipmentName}-${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {!disabled && (
                    <span role="button" onClick={() => onRemovePhoto(i)} style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 20, height: 20, borderRadius: 10,
                      background: 'rgba(224,49,49,0.88)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: 12, lineHeight: 1, fontWeight: 600,
                    }}>✕</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 检查清单 */}
        <Text strong style={{ fontSize: 14, color: '#37352f', display: 'block', marginBottom: 14 }}>
          检查项目
        </Text>
        <Form form={form} layout="vertical">
          {templateItems.map((item, i) => (
            <div key={item.id} style={{
              padding: '14px 16px', marginBottom: 8,
              background: '#fafaf9', borderRadius: 8,
              border: '1px solid #ede9e4',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 20, height: 20, borderRadius: 10,
                      background: '#5645d4', color: '#fff',
                      fontSize: 11, fontWeight: 700, lineHeight: 1,
                    }}>
                      {i + 1}
                    </span>
                    <Text strong style={{ fontSize: 14 }}>{item.item_name}</Text>
                  </div>
                  {item.expected_result && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2, marginLeft: 28 }}>
                      标准值: {item.expected_result}
                    </Text>
                  )}
                  {item.item_description && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginLeft: 28 }}>
                      {item.item_description}
                    </Text>
                  )}
                </div>
                <Form.Item name={['records', i, 'result']} initialValue="正常" noStyle>
                  <Select size="small" disabled={disabled} style={{ width: 100, borderRadius: 6 }}
                    options={[
                      { label: '正常', value: '正常' },
                      { label: '异常', value: '异常' },
                      { label: '跳过', value: '跳过' },
                    ]}
                  />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: 10, marginLeft: 28 }}>
                <Form.Item name={['records', i, 'actual_value']} style={{ flex: 1, marginBottom: 0 }}>
                  <Input size="small" placeholder="实际值" disabled={disabled} style={{ borderRadius: 6 }} />
                </Form.Item>
                <Form.Item name={['records', i, 'remark']} style={{ flex: 1, marginBottom: 0 }}>
                  <Input size="small" placeholder="备注" disabled={disabled} style={{ borderRadius: 6 }} />
                </Form.Item>
              </div>
            </div>
          ))}
        </Form>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={disabled}
            icon={<CheckOutlined />}
            style={{ borderRadius: 8, fontWeight: 600, height: 38, paddingInline: 24 }}
          >
            提交本设备检查
          </Button>
        </div>
      </div>
    </div>
  )
}
