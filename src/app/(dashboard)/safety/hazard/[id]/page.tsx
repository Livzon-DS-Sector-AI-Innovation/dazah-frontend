'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  App,
  Spin,
  Steps,
  Modal,
  Input,
  Collapse,
  Alert,
} from 'antd'
import {
  ArrowLeftOutlined,
  RobotOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  EditOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import {
  getHazard,
  updateHazard,
} from '@/actions/safety'
import type { HazardReport } from '@/types/safety'
import {
  AI_NODE_PROGRESS_OPTIONS_HAZARD,
  OVERALL_STATUS_OPTIONS_HAZARD,
  HAZARD_TYPE_OPTIONS,
  HAZARD_LEVEL_OPTIONS,
  RECTIFICATION_STATUS_OPTIONS,
  VERIFY_LEVEL_OPTIONS,
  VERIFY_LEVEL_STATUS_OPTIONS,
} from '@/types/safety'
import HazardRectificationReplyModal from '@/components/safety/HazardRectificationReplyModal'
import HazardVerifyModal from '@/components/safety/HazardVerifyModal'
import dayjs from 'dayjs'
import { getWorkflowStepList } from '@/lib/workflow-templates'

const { Title, Text } = Typography

// ── 步骤图标映射 ──
const STEP_ICONS: Record<number, React.ReactNode> = {
  1: <FileSearchOutlined />,
  2: <FileTextOutlined />,
}

// ── 工作流步骤配置 ──
const WORKFLOW_STEPS = getWorkflowStepList('hazard').map((s) => ({
  ...s,
  icon: STEP_ICONS[s.num] || <RobotOutlined />,
}))

// ── 字段中文标签 ──
function getFieldLabel(scriptNum: number, field: string): string {
  const labels: Record<string, Record<string, string>> = {
    1: {
      hazard_type: '隐患分类',
      hazard_level: '隐患等级',
      hazard_category: '隐患类别',
      description: '隐患描述',
      location: '地点/部位',
      key_defect: '重点缺陷',
      major_hazard_basis: '判定依据',
    },
    2: {
      control_measures: '管控措施',
      corrective_preventive_measures: '纠正预防措施',
    },
  }
  return labels[scriptNum]?.[field] || field
}

// ── 隐患类型标签 ──
function getHazardTypeTag(value: string) {
  const opt = HAZARD_TYPE_OPTIONS.find((o) => o.value === value)
  return <Tag>{opt?.label || value}</Tag>
}

// ── 隐患等级标签 ──
function getHazardLevelTag(value: string) {
  const opt = HAZARD_LEVEL_OPTIONS.find((o) => o.value === value)
  return <Tag color={opt?.color}>{opt?.label || value}</Tag>
}

// ── 隐患类别标签 ──
function getHazardCategoryTag(value: string) {
  const labelMap: Record<string, string> = {
    equipment: '设备设施',
    hazardous_storage: '危化储存',
    emergency_mgmt: '应急管理',
    instrument_electrical: '仪表+电气',
    lightning_antistatic: '防雷防静电',
    occupational_health: '职业健康+劳保防护',
    violation_operation: '三违作业',
    six_s: '6S',
    label_signage: '标签标识',
    process_mgmt: '工艺管理',
    contractor_defect: '承包商缺陷',
    documentation: '文件化',
    special_operation: '特殊作业',
  }
  return <Tag>{labelMap[value] || value}</Tag>
}

export default function HazardDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [record, setRecord] = useState<HazardReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStep, setSelectedStep] = useState(1)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingScript, setEditingScript] = useState<number>(0)
  const [editForm, setEditForm] = useState<Record<string, unknown>>({})
  const { message } = App.useApp()
  // ── 整改回复 & 复核 Modal ──
  const [replyModalVisible, setReplyModalVisible] = useState(false)
  const [replyMode, setReplyMode] = useState<'reply' | 'rework'>('reply')
  const [verifyModalVisible, setVerifyModalVisible] = useState(false)

  const loadRecord = async () => {
    try {
      const response = await getHazard(id)
      if (response.code === 200) {
        setRecord(response.data)
        const data = response.data as HazardReport
        const cur = getCurrentStepNum(data.ai_node_progress)
        setSelectedStep(cur)
      } else {
        message.error('加载失败')
        router.push('/safety/hazard')
      }
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadRecord()
  }, [id])

  const getCurrentStepNum = (progress: string): number => {
    if (progress === 'completed') return 2
    if (progress === 'pending_input') return 1
    const match = progress.match(/script(\d)/)
    return match ? parseInt(match[1]) : 1
  }

  const handleEditConfirm = async () => {
    try {
      const response = await updateHazard(id, editForm as Record<string, unknown>)
      if (response.code === 200) {
        message.success('更新成功')
        setRecord(response.data as HazardReport)
        setEditModalVisible(false)
      } else {
        message.error(response.message || '更新失败')
      }
    } catch {
      message.error('更新失败')
    }
  }

  const openEditModal = (scriptNum: number, fields: Record<string, unknown>) => {
    setEditingScript(scriptNum)
    setEditForm(fields)
    setEditModalVisible(true)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!record) return null

  const currentStepNum = getCurrentStepNum(record.ai_node_progress)
  const currentStep = WORKFLOW_STEPS[selectedStep - 1]
  const currentOutputFields = getScriptOutputFields(selectedStep, record)
  const hasOutput = Object.values(currentOutputFields).some(
    (v) => v !== null && v !== undefined && v !== ''
  )
  const isAICompleted = record.overall_status === 'completed'
  const isAIReviewed = record.overall_status === 'reviewed'

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* 返回 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/safety/hazard')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      {/* 标题 & 状态 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
            隐患排查详情
          </h1>
          <Text style={{ color: '#5d5b54' }}>编号：{record.hazard_no}</Text>
        </div>
        <Space>
          {getOverallStatusTag(record.overall_status)}
          {getProgressTag(record.ai_node_progress)}
        </Space>
      </div>

      {/* AI 自动执行提示 */}
      {isAICompleted && (
        <Alert
          type="info"
          showIcon
          icon={<AuditOutlined />}
          title="AI 已自动完成隐患识别和整改建议生成"
          description={
            <span>
              AI 输出结果仅供参考，请在
              <a onClick={() => router.push('/safety/hazard-ledger')} style={{ cursor: 'pointer', color: '#5645d4', fontWeight: 600 }}>
                【隐患台账】
              </a>
              中进行审核编辑，审核完成后进入整改流程。
            </span>
          }
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {isAIReviewed && (
        <Alert
          type="success"
          showIcon
          title="AI 输出已通过人工审核，隐患已进入整改流程"
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {record.ai_error_message && (
        <Alert
          type="error"
          showIcon
          title="AI 执行异常"
          description={record.ai_error_message}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* 基础信息 (折叠) */}
      <Collapse
        items={[{
          key: 'basic',
          label: <Space><FileTextOutlined /><span>基础信息</span></Space>,
          children: (
            <Descriptions column={3} size="small" bordered>
              <Descriptions.Item label="隐患编号">{record.hazard_no}</Descriptions.Item>
              <Descriptions.Item label="部门">{record.department || '-'}</Descriptions.Item>
              <Descriptions.Item label="地点/部位">{record.location || '-'}</Descriptions.Item>
              <Descriptions.Item label="发现人">{record.discovered_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="发现时间">
                {dayjs(record.discovered_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="责任部门">{record.department || '-'}</Descriptions.Item>
              {record.defect_photos && (
                <Descriptions.Item label="缺陷图片" span={3}>
                  {record.defect_photos}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">
                {dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(record.updated_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="AI生成">
                <Tag color={record.ai_generated ? 'purple' : 'default'} icon={record.ai_generated ? <RobotOutlined /> : undefined}>
                  {record.ai_generated ? 'AI识别' : '人工录入'}
                </Tag>
              </Descriptions.Item>
              {record.notes && (
                <Descriptions.Item label="备注" span={3}>{record.notes}</Descriptions.Item>
              )}
            </Descriptions>
          ),
        }]}
        style={{ marginBottom: 24, borderRadius: 12 }}
      />

      {/* 流程进度 Steps */}
      <Card style={{ marginBottom: 24, borderRadius: 12, border: '1px solid #e5e3df' }}>
        <Steps
          current={isAICompleted || isAIReviewed ? 1 : currentStepNum - 1}
          status={isAIReviewed ? 'finish' : isAICompleted ? 'finish' : 'process'}
          size="small"
          onChange={(step) => setSelectedStep(step + 1)}
          items={WORKFLOW_STEPS.map((s, i) => {
            let status: 'wait' | 'process' | 'finish' | 'error' = 'wait'
            if (isAIReviewed) {
              status = 'finish'
            } else if (isAICompleted) {
              status = 'finish'
            } else if (i < currentStepNum - 1) {
              status = 'finish'
            } else if (i === currentStepNum - 1) {
              status = 'process'
            }
            if (record.ai_error_message && i === currentStepNum - 1) status = 'error'
            return { title: s.title, status }
          })}
        />
      </Card>

      {/* 左右分栏 */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧：步骤选择 */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex' }}>
          <Card
            size="small"
            title="工作流步骤"
            style={{ borderRadius: 12, border: '1px solid #e5e3df', flex: 1 }}
            styles={{ body: { padding: 16 } }}
          >
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step.num}
                onClick={() => setSelectedStep(step.num)}
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginBottom: 4,
                  background: selectedStep === step.num ? '#f0edff' : 'transparent',
                  border: selectedStep === step.num ? '1px solid #5645d4' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Space>
                  {step.icon}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: selectedStep === step.num ? 600 : 400,
                      color: selectedStep === step.num ? '#5645d4' : '#37352f',
                    }}
                  >
                    {step.num}. {step.title}
                  </Text>
                </Space>
              </div>
            ))}
          </Card>
        </div>

        {/* 右侧：输出结果 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          <Card
            size="small"
            title={`步骤${selectedStep}：${currentStep?.title || ''} — AI 输出结果`}
            extra={
              hasOutput ? (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(selectedStep, currentOutputFields)}
                >
                  编辑
                </Button>
              ) : null
            }
            style={{ borderRadius: 12, border: '1px solid #e5e3df', flex: 1 }}
          >
            {record.ai_error_message && (
              <div style={{
                marginBottom: 12, padding: '8px 12px', background: '#fff2f0',
                border: '1px solid #ffccc7', borderRadius: 8, fontSize: 13, color: '#e03131',
              }}>
                ⚠️ {record.ai_error_message}
              </div>
            )}
            {hasOutput ? (
              <Descriptions size="small" column={1} bordered>
                {Object.entries(currentOutputFields)
                  .filter(([, v]) => v !== null && v !== undefined && v !== '')
                  .map(([key, val]) => (
                    <Descriptions.Item key={key} label={getFieldLabel(selectedStep, key)}>
                      {renderFieldValue(selectedStep, key, val)}
                    </Descriptions.Item>
                  ))}
              </Descriptions>
            ) : (
              <Text type="secondary" italic>
                {record.ai_error_message
                  ? 'AI 执行出错，请在台账中手动审核编辑或重新执行 AI'
                  : record.overall_status === 'completed' || record.overall_status === 'reviewed'
                    ? 'AI 已执行完成，请在下方查看对应步骤的输出'
                    : 'AI 正在处理中，请稍候刷新页面查看结果'}
              </Text>
            )}
          </Card>
        </div>
      </div>

      {/* 整改进度信息 */}
      {record.rectification_status !== 'pending' && (
        <Card
          size="small"
          title="整改信息"
          style={{ marginTop: 24, borderRadius: 12, border: '1px solid #e5e3df' }}
          extra={
            <Space>
              {record.rectification_status === 'in_progress' && (
                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => { setReplyMode('reply'); setReplyModalVisible(true) }}
                >
                  整改回复
                </Button>
              )}
              {record.rectification_status === 'rejected' && (
                <Button
                  size="small"
                  danger
                  icon={<EditOutlined />}
                  onClick={() => { setReplyMode('rework'); setReplyModalVisible(true) }}
                >
                  重新整改
                </Button>
              )}
              {(record.rectification_status === 'replied' ||
                record.rectification_status === 'level1_approved' ||
                record.rectification_status === 'level2_approved') && (
                <Button
                  size="small"
                  type="primary"
                  icon={<SafetyCertificateOutlined />}
                  onClick={() => setVerifyModalVisible(true)}
                >
                  {record.rectification_status === 'replied'
                    ? '一级复核'
                    : record.rectification_status === 'level1_approved'
                      ? '二级复核'
                      : '三级复核'}
                </Button>
              )}
            </Space>
          }
        >
          <Descriptions column={3} size="small" bordered>
            <Descriptions.Item label="整改责任人">
              {record.rectification_responsible_person_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="整改责任部门">
              {record.rectification_responsible_department || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="计划完成时间">
              {record.deadline ? dayjs(record.deadline).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="整改状态" span={3}>
              {getRectificationTag(record.rectification_status)}
            </Descriptions.Item>
            {record.control_measures && (
              <Descriptions.Item label="管控措施" span={3}>
                {record.control_measures}
              </Descriptions.Item>
            )}
            {record.corrective_preventive_measures && (
              <Descriptions.Item label="纠正预防措施" span={3}>
                {record.corrective_preventive_measures}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* 整改回复内容 */}
      {record.rectification_reply && (
        <Card
          size="small"
          title="📝 整改回复"
          style={{ marginTop: 16, borderRadius: 12, border: '1px solid #e5e3df' }}
        >
          <div style={{
            background: '#f0f7ff',
            padding: 16,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 14,
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
          }}>
            {record.rectification_reply}
          </div>
          <Descriptions column={3} size="small">
            <Descriptions.Item label="回复人">
              {record.rectification_replied_by_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="回复时间">
              {record.rectification_replied_at
                ? dayjs(record.rectification_replied_at).format('YYYY-MM-DD HH:mm')
                : '-'}
            </Descriptions.Item>
            {record.rectification_photos && (
              <Descriptions.Item label="整改后图片" span={3}>
                {record.rectification_photos}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* 三级复核进度 */}
      {(record.verify_level_1_status !== 'pending' ||
        record.verify_level_2_status !== 'pending' ||
        record.verify_level_3_status !== 'pending' ||
        record.rectification_status === 'replied' ||
        record.rectification_status === 'level1_approved' ||
        record.rectification_status === 'level2_approved' ||
        record.rectification_status === 'closed') && (
        <Card
          size="small"
          title="🔍 三级复核"
          style={{ marginTop: 16, borderRadius: 12, border: '1px solid #e5e3df' }}
        >
          {[1, 2, 3].map((level) => {
            const status = (record as Record<string, unknown>)[`verify_level_${level}_status`] as string || 'pending'
            const byName = (record as Record<string, unknown>)[`verify_level_${level}_by_name`] as string
            const at = (record as Record<string, unknown>)[`verify_level_${level}_at`] as string
            const opinion = (record as Record<string, unknown>)[`verify_level_${level}_opinion`] as string
            const levelLabel = VERIFY_LEVEL_OPTIONS.find((o) => o.value === level)?.label || `${level}级`
            const statusOpt = VERIFY_LEVEL_STATUS_OPTIONS.find((o) => o.value === status)

            return (
              <div
                key={level}
                style={{
                  padding: '12px 16px',
                  marginBottom: level < 3 ? 12 : 0,
                  background: status === 'approved' ? '#f6ffed' : status === 'rejected' ? '#fff2f0' : '#faf9f7',
                  borderRadius: 8,
                  border: `1px solid ${status === 'approved' ? '#b7eb8f' : status === 'rejected' ? '#ffccc7' : '#e5e3df'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{levelLabel}</span>
                  <Tag color={statusOpt?.color}>{statusOpt?.label || status}</Tag>
                </div>
                {byName && (
                  <div style={{ fontSize: 12, color: '#5d5b54' }}>
                    复核人：{byName}
                    {at ? ` | ${dayjs(at).format('YYYY-MM-DD HH:mm')}` : ''}
                  </div>
                )}
                {opinion && (
                  <div style={{ fontSize: 13, color: '#37352f', marginTop: 4, fontStyle: 'italic' }}>
                    「{opinion}」
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      )}

      {/* 整改回复 Modal */}
      <HazardRectificationReplyModal
        open={replyModalVisible}
        record={record}
        mode={replyMode}
        onClose={() => setReplyModalVisible(false)}
        onSuccess={(updated) => { setRecord(updated) }}
      />

      {/* 三级复核 Modal */}
      <HazardVerifyModal
        open={verifyModalVisible}
        record={record}
        onClose={() => setVerifyModalVisible(false)}
        onSuccess={(updated) => { setRecord(updated) }}
      />

      {/* 编辑Modal */}
      <Modal
        title={`编辑步骤${editingScript}字段`}
        open={editModalVisible}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={600}
        destroyOnHidden
      >
        {Object.entries(editForm).map(([key, val]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
              {getFieldLabel(editingScript, key)}
            </Text>
            <Input.TextArea
              rows={2}
              value={val as string}
              onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          </div>
        ))}
      </Modal>
    </div>
  )
}

// ==================== Helper Functions ====================

function getOverallStatusTag(value: string) {
  const opt = OVERALL_STATUS_OPTIONS_HAZARD.find((o) => o.value === value)
  return <Tag color={opt?.color}>{opt?.label || value}</Tag>
}

function getProgressTag(value: string) {
  const opt = AI_NODE_PROGRESS_OPTIONS_HAZARD.find((o) => o.value === value)
  return <Tag color={opt?.color}>{opt?.label || value}</Tag>
}

function getRectificationTag(value: string) {
  const opt = RECTIFICATION_STATUS_OPTIONS.find((o) => o.value === value)
  return <Tag color={opt?.color}>{opt?.label || value}</Tag>
}

function renderFieldValue(scriptNum: number, key: string, val: unknown) {
  if (key === 'hazard_type') return getHazardTypeTag(val as string)
  if (key === 'hazard_level') return getHazardLevelTag(val as string)
  if (key === 'hazard_category') return getHazardCategoryTag(val as string)
  return String(val ?? '-')
}

function getScriptOutputFields(scriptNum: number, record: HazardReport): Record<string, unknown> {
  const step = WORKFLOW_STEPS.find((s) => s.num === scriptNum)
  const fields = step?.expected_keys || []
  const result: Record<string, unknown> = {}
  for (const f of fields) {
    result[f] = (record as unknown as Record<string, unknown>)[f]
  }
  return result
}
