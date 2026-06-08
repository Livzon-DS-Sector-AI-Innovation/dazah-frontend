'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Space, Input, Select, DatePicker, Tag, Card,
  Typography, Drawer, Descriptions, Switch, App, Tooltip, Modal, Spin,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined, ExportOutlined, EyeOutlined,
  AlertOutlined, SafetyCertificateOutlined,
  EnvironmentOutlined, ClockCircleOutlined, RobotOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  getSpecialOperationLedger,
} from '@/actions/safety'
import type {
  SpecialOperationReport,
} from '@/types/safety'

const { Text } = Typography
const { RangePicker } = DatePicker

// ── DESIGN.md Token Colors ──
const T = {
  primary: '#5645d4', error: '#E03131', warning: '#DD5B00', success: '#1AAE39',
  ink: '#1a1a1a', charcoal: '#37352f', slate: '#5d5b54', steel: '#787671',
  muted: '#bbb8b1', hairline: '#e5e3df', surface: '#f6f5f4', canvas: '#ffffff',
  sky: '#dcecfa', lavender: '#e6e0f5', peach: '#ffe8d4', rose: '#fde0ec',
  mint: '#d9f3e1', yellow: '#fef7d6',
}

// ── Operation type labels & colors ──
const OP_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  hot_work: { label: '动火作业', color: '#DC2626', bg: '#fef2f2' },
  confined_space: { label: '受限空间', color: '#7C3AED', bg: '#f5f3ff' },
  height_work: { label: '高处作业', color: '#2563EB', bg: '#eff6ff' },
  temporary_electricity: { label: '临时用电', color: '#D97706', bg: '#fffbeb' },
  blind_plate: { label: '盲板抽堵', color: '#059669', bg: '#ecfdf5' },
  excavation: { label: '动土作业', color: '#9333EA', bg: '#faf5ff' },
  lifting: { label: '起重吊装', color: '#0891B2', bg: '#ecfeff' },
  road_breaking: { label: '断路作业', color: '#4F46E5', bg: '#eef2ff' },
}

const OP_LEVEL_LABELS: Record<string, string> = {
  special: '特级', grade1: '一级', grade2: '二级', not_applicable: '不涉及',
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  submitted: { color: '#D97706', bg: '#fffbeb', label: '审批中' },
  approved: { color: '#059669', bg: '#ecfdf5', label: '已审批' },
  rejected: { color: '#DC2626', bg: '#fef2f2', label: '已驳回' },
  draft: { color: T.steel, bg: T.surface, label: '草稿' },
}

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════

export default function SpecialOpsLedger() {
  const { message } = App.useApp()
  // ── State ──
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SpecialOperationReport[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Filters
  const [opType, setOpType] = useState<string | undefined>()
  const [opLevel, setOpLevel] = useState<string | undefined>()
  const [dept, setDept] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [keyword, setKeyword] = useState('')
  const [isCritical, setIsCritical] = useState<boolean | undefined>()

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<SpecialOperationReport | null>(null)

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportQuery, setExportQuery] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [exportExplanation, setExportExplanation] = useState('')

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSpecialOperationLedger({
        page, page_size: pageSize,
        operation_type: opType, operation_level: opLevel,
        department: dept,
        date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
        date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
        keyword: keyword || undefined,
        is_critical: isCritical,
      })
      setData(res.data || [])
      setTotal(res.meta?.total || 0)
    } catch {
      message.error('获取台账数据失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, opType, opLevel, dept, dateRange, keyword, isCritical])

  useEffect(() => { fetchData() }, [fetchData])

  // ── AI Export ──
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api/v1'

  const handleAIExport = async () => {
    if (!exportQuery.trim()) {
      // Direct export with current filters
      await downloadExcel({})
      return
    }
    setExportLoading(true)
    try {
      // AI parse natural language first
      const parseRes = await fetch(`${API_BASE}/safety/special-operation-ledger/parse-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ natural_query: exportQuery }),
      })
      const parseData = await parseRes.json()
      setExportExplanation(parseData.data?.explanation || '')
      // Export with AI-parsed filters
      await downloadExcel(parseData.data || {})
    } catch {
      message.error('AI 解析失败，使用当前筛选条件导出')
      await downloadExcel({})
    } finally {
      setExportLoading(false)
    }
  }

  const downloadExcel = async (aiFilters: Record<string, unknown>) => {
    try {
      const body: Record<string, unknown> = {
        ...aiFilters,
        operation_type: aiFilters.operation_type || opType,
        operation_level: aiFilters.operation_level || opLevel,
        department: aiFilters.department || dept,
        date_from: aiFilters.date_from || dateRange?.[0]?.format('YYYY-MM-DD'),
        date_to: aiFilters.date_to || dateRange?.[1]?.format('YYYY-MM-DD'),
        keyword: aiFilters.keyword || keyword || undefined,
        is_critical: aiFilters.is_critical ?? isCritical,
      }
      // Clean empty values
      Object.keys(body).forEach(k => { if (body[k] === undefined || body[k] === null || body[k] === '') delete body[k] })

      const res = await fetch(`${API_BASE}/safety/special-operation-ledger/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('导出失败')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `特殊作业台账_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('导出成功')
      setExportModalOpen(false)
      setExportQuery('')
      setExportExplanation('')
    } catch {
      message.error('导出失败')
    }
  }

  // ── Shared card style ──
  const cardStyle: React.CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${T.hairline}`,
    backgroundColor: T.canvas,
  }

  // ── Columns ──
  const columns: ColumnsType<SpecialOperationReport> = [
    {
      title: '报备编号', dataIndex: 'report_no', key: 'report_no', width: 140,
      render: (v, record) => (
        <a
          onClick={() => {
            if (record.status === 'submitted') {
              window.location.href = `/safety/special-ops/report?id=${record.id}`
            } else {
              setDetailItem(record)
              setDrawerOpen(true)
            }
          }}
          style={{ color: '#0075de', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}
        >
          {v}
        </a>
      ),
    },
    {
      title: '作业类型', dataIndex: 'operation_type', key: 'op_type', width: 100,
      render: (v: string) => {
        const cfg = OP_TYPE_CONFIG[v]
        return <Tag style={{ color: cfg?.color, backgroundColor: cfg?.bg, border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12 }}>{cfg?.label || v}</Tag>
      },
    },
    {
      title: '作业级别', dataIndex: 'operation_level', key: 'op_level', width: 80,
      render: (v: string) => {
        const label = OP_LEVEL_LABELS[v]
        const color = v === 'special' ? T.error : v === 'grade1' ? T.warning : T.slate
        return <Text style={{ color, fontSize: 13 }}>{label || v}</Text>
      },
    },
    {
      title: '作业地点', dataIndex: 'location', key: 'location', width: 130, ellipsis: true,
      render: (v) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: T.muted, fontSize: 11 }} />
          <Text style={{ color: T.charcoal, fontSize: 13 }}>{v || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '作业内容', dataIndex: 'work_description', key: 'desc', width: 160, ellipsis: true,
      render: (v) => <Tooltip title={v}><Text style={{ color: T.charcoal, fontSize: 13 }}>{v || '-'}</Text></Tooltip>,
    },
    {
      title: '作业部门', dataIndex: 'department', key: 'dept', width: 100, ellipsis: true,
      render: (v) => <Text style={{ color: T.steel, fontSize: 13 }}>{v || '-'}</Text>,
    },
    {
      title: '计划时间', key: 'time', width: 170,
      render: (_, r) => {
        const start = r.planned_start_time ? dayjs(r.planned_start_time).format('MM-DD HH:mm') : '-'
        const end = r.planned_end_time ? dayjs(r.planned_end_time).format('MM-DD HH:mm') : '-'
        return (
          <Space size={4}>
            <ClockCircleOutlined style={{ color: T.muted, fontSize: 11 }} />
            <Text style={{ color: T.charcoal, fontSize: 12 }}>{start} ~ {end}</Text>
          </Space>
        )
      },
    },
    {
      title: '报备人', dataIndex: 'applicant_name', key: 'applicant', width: 80,
      render: (v) => <Text style={{ color: T.steel, fontSize: 13 }}>{v || '-'}</Text>,
    },
    {
      title: '审批状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => {
        const cfg = STATUS_CONFIG[v] || { color: T.steel, bg: T.surface, label: v }
        return <Tag style={{ color: cfg.color, backgroundColor: cfg.bg, border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12 }}>{cfg.label}</Tag>
      },
    },
    {
      title: '审批时间', dataIndex: 'approved_at', key: 'approved_at', width: 110,
      render: (v) => <Text style={{ color: T.steel, fontSize: 12 }}>{v ? dayjs(v).format('MM-DD HH:mm') : '-'}</Text>,
    },
    {
      title: '关键作业', dataIndex: 'is_critical', key: 'critical', width: 90,
      render: (v: boolean) => v
        ? <Tag style={{ color: T.error, backgroundColor: T.rose, border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12 }}>关键</Tag>
        : <Text style={{ color: T.muted, fontSize: 13 }}>-</Text>,
    },
    {
      title: '操作', key: 'action', width: 80, fixed: 'right',
      render: (_, record) => (
        <Button
          type="link" size="small" icon={<EyeOutlined />}
          style={{ color: '#0075de', padding: '0 4px' }}
          onClick={() => {
            setDetailItem(record)
            setDrawerOpen(true)
          }}
        >
          详情
        </Button>
      ),
    },
  ]

  // ── Render ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text strong style={{ fontSize: 18, color: T.ink }}>特殊作业台账</Text>
          <div style={{ color: T.slate, fontSize: 13, marginTop: 2 }}>报备审批通过后自动汇入台账 · 全生命周期追踪</div>
        </div>
        <Button
          icon={<ExportOutlined />}
          onClick={() => setExportModalOpen(true)}
          style={{
            borderRadius: 8, height: 40, fontWeight: 500,
            border: `1px solid ${T.hairline}`,
            color: T.charcoal, backgroundColor: T.canvas,
          }}
        >
          导出Excel
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <Card
        variant="borderless"
        style={cardStyle}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space wrap size="middle">
          <Select
            placeholder="作业类型" allowClear
            style={{ width: 130, borderRadius: 8 }}
            value={opType} onChange={setOpType}
            options={Object.entries(OP_TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <Select
            placeholder="作业级别" allowClear
            style={{ width: 110, borderRadius: 8 }}
            value={opLevel} onChange={setOpLevel}
            options={Object.entries(OP_LEVEL_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)}
            style={{ borderRadius: 8 }}
            placeholder={['开始日期', '结束日期']}
          />
          <Input
            placeholder="搜索编号/地点/内容"
            prefix={<SearchOutlined style={{ color: T.muted }} />}
            style={{ width: 220, borderRadius: 8, height: 44, backgroundColor: T.surface, border: `1px solid ${T.hairline}` }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => fetchData()}
            allowClear
          />
          <Space>
            <AlertOutlined style={{ color: T.error }} />
            <Text style={{ color: T.steel, fontSize: 12 }}>关键作业</Text>
            <Switch
              size="small"
              checked={isCritical === true}
              onChange={(v) => setIsCritical(v ? true : undefined)}
            />
          </Space>
        </Space>
      </Card>

      {/* ── Table Card ── */}
      <Card
        variant="borderless"
        style={cardStyle}
        styles={{ body: { padding: 0 } }}
      >
        <Table<SpecialOperationReport>
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          size="middle"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => <Text style={{ color: T.steel }}>共 {t} 条</Text>,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </Card>

      {/* ── Detail Drawer ── */}
      <Drawer
        title={<Space><SafetyCertificateOutlined style={{ color: T.primary }} /><span>台账详情</span></Space>}
        placement="right"
        size="large"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDetailItem(null) }}
      >
        {detailItem && (
          <Descriptions column={2} size="small" bordered labelStyle={{ fontWeight: 600, color: T.slate }}>
            <Descriptions.Item label="报备编号">{detailItem.report_no}</Descriptions.Item>
            <Descriptions.Item label="作业类型">
              <Tag style={{ color: OP_TYPE_CONFIG[detailItem.operation_type]?.color, backgroundColor: OP_TYPE_CONFIG[detailItem.operation_type]?.bg, border: 'none', borderRadius: 6, fontWeight: 600 }}>
                {OP_TYPE_CONFIG[detailItem.operation_type]?.label || detailItem.operation_type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="作业级别">{OP_LEVEL_LABELS[detailItem.operation_level] || detailItem.operation_level}</Descriptions.Item>
            <Descriptions.Item label="作业地点">{detailItem.location || '-'}</Descriptions.Item>
            <Descriptions.Item label="作业部门">{detailItem.department || '-'}</Descriptions.Item>
            <Descriptions.Item label="报备人">{detailItem.applicant_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="审批人">{detailItem.approver_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="审批时间">{detailItem.approved_at ? dayjs(detailItem.approved_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="计划开始">{detailItem.planned_start_time ? dayjs(detailItem.planned_start_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="计划结束">{detailItem.planned_end_time ? dayjs(detailItem.planned_end_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="关键作业" span={2}>
              {detailItem.is_critical ? (
                <Tag style={{ color: T.error, backgroundColor: T.rose, border: 'none', borderRadius: 6, fontWeight: 600 }}>是</Tag>
              ) : <Tag>否</Tag>}
              {detailItem.is_critical_reason && (
                <Text style={{ color: T.slate, marginLeft: 8, fontSize: 12 }}>判定理由：{detailItem.is_critical_reason}</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="作业内容" span={2}>{detailItem.work_description || '-'}</Descriptions.Item>
            <Descriptions.Item label="驳回原因" span={2}>{detailItem.rejection_reason || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{detailItem.notes || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* ── AI Export Modal ── */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: T.primary }} />
            <span>AI 智能导出</span>
          </Space>
        }
        open={exportModalOpen}
        onCancel={() => { setExportModalOpen(false); setExportQuery(''); setExportExplanation('') }}
        footer={[
          <Button
            key="cancel"
            onClick={() => { setExportModalOpen(false); setExportQuery(''); setExportExplanation('') }}
            style={{ borderRadius: 8 }}
          >
            取消
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<ExportOutlined />}
            loading={exportLoading}
            onClick={handleAIExport}
            style={{ borderRadius: 8 }}
          >
            导出 Excel
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <Text style={{ color: T.slate, fontSize: 13 }}>
              用自然语言描述你想导出哪些特殊作业，AI 会自动识别筛选条件。
            </Text>
          </div>
          <Input.TextArea
            rows={4}
            placeholder={'例如：\n• 导出上月所有特级动火作业\n• 给我看今年高风险等级的受限空间作业\n• 导出张三提交的所有审批中报备\n• 留空则按当前筛选条件导出'}
            value={exportQuery}
            onChange={e => setExportQuery(e.target.value)}
            style={{ borderRadius: 8 }}
          />
          {exportExplanation && (
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: T.lavender, borderRadius: 8 }}
            >
              <Space>
                <RobotOutlined style={{ color: T.primary, fontSize: 12 }} />
                <Text style={{ color: T.charcoal, fontSize: 12 }}>
                  AI 解读：{exportExplanation}
                </Text>
              </Space>
            </div>
          )}
          {exportLoading && (
            <div className="text-center py-4">
              <Spin tip="AI 正在分析您的需求..." />
            </div>
          )}
          <Text type="secondary" style={{ fontSize: 11 }}>
            提示：留空自然语言输入将按当前页面的筛选条件导出。导出上限 10,000 条。
          </Text>
        </div>
      </Modal>
    </div>
  )
}
