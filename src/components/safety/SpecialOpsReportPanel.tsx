'use client'

import { useState, useEffect } from 'react'
import {
  Table, Button, Space, Input, Select, Modal, Form, DatePicker, Tag, Row, Col, Typography, Switch, App, Tooltip, Card,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  SendOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useSafetyStore } from '@/stores/safety'
import {
  getSpecialOperationReports,
  createSpecialOperationReport,
  updateSpecialOperationReport,
  deleteSpecialOperationReport,
  submitSpecialOperationReport,
  approveSpecialOperationReport,
  rejectSpecialOperationReport,
  setSpecialOperationReportCritical,
} from '@/actions/safety'
import type { SpecialOperationReport, SpecialOperationReportFormData } from '@/types/safety'

const { Text } = Typography
const { TextArea } = Input

// ── DESIGN.md Token Colors ──
const T = {
  primary: '#5645d4', error: '#E03131', warning: '#DD5B00', success: '#1AAE39',
  ink: '#1a1a1a', charcoal: '#37352f', slate: '#5d5b54', steel: '#787671',
  muted: '#bbb8b1', hairline: '#e5e3df', surface: '#f6f5f4', canvas: '#ffffff',
  sky: '#dcecfa', lavender: '#e6e0f5', rose: '#fde0ec',
}

// ── Operation type config ──
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

const OP_LEVEL_OPTIONS = [
  { value: 'special', label: '特级' },
  { value: 'grade1', label: '一级' },
  { value: 'grade2', label: '二级' },
  { value: 'not_applicable', label: '不涉及' },
]

const REPORT_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
]

const STATUS_TAG: Record<string, { color: string; bg: string; label: string }> = {
  draft: { color: T.steel, bg: T.surface, label: '草稿' },
  submitted: { color: '#D97706', bg: '#fffbeb', label: '审批中' },
  approved: { color: '#059669', bg: '#ecfdf5', label: '已审批' },
  rejected: { color: '#DC2626', bg: '#fef2f2', label: '已驳回' },
}

export default function SpecialOpsReportPanel() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [rejectVisible, setRejectVisible] = useState(false)
  const [rejectId, setRejectId] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [editingRecord, setEditingRecord] = useState<SpecialOperationReport | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()

  const {
    specialOpReports, specialOpReportTotal, specialOpReportQueryParams,
    setSpecialOpReports, setSpecialOpReportTotal, setSpecialOpReportQueryParams,
    addSpecialOpReport, updateSpecialOpReport: updateInStore, removeSpecialOpReport,
  } = useSafetyStore()

  // Init form when editing
  useEffect(() => {
    if (editingRecord) {
      editForm.setFieldsValue({
        ...editingRecord,
        planned_start_time: editingRecord.planned_start_time ? dayjs(editingRecord.planned_start_time) : undefined,
        planned_end_time: editingRecord.planned_end_time ? dayjs(editingRecord.planned_end_time) : undefined,
      })
    }
  }, [editingRecord, editForm])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await getSpecialOperationReports({
        ...specialOpReportQueryParams,
        status: statusFilter, operation_type: typeFilter, keyword: searchText || undefined,
      })
      if (response.code === 200) {
        setSpecialOpReports(response.data as SpecialOperationReport[])
        setSpecialOpReportTotal(response.meta?.total || 0)
      }
    } catch { message.error('加载报备列表失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [specialOpReportQueryParams.page, specialOpReportQueryParams.page_size, statusFilter, typeFilter])

  const handleSearch = () => { setSpecialOpReportQueryParams({ page: 1 }); loadData() }

  const handleAdd = () => { setEditingRecord(null); form.resetFields(); setModalVisible(true) }
  const handleEdit = (record: SpecialOperationReport) => { setEditingRecord(record); setModalVisible(true) }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除', content: '确定要删除该报备吗？',
      onOk: async () => {
        const r = await deleteSpecialOperationReport(id)
        if (r.code === 200) { message.success('已删除'); removeSpecialOpReport(id) }
        else { message.error(r.message || '删除失败') }
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = editingRecord ? await editForm.validateFields() : await form.validateFields()
      const formatted = {
        ...values,
        planned_start_time: values.planned_start_time?.toISOString(),
        planned_end_time: values.planned_end_time?.toISOString(),
      }
      if (editingRecord) {
        const r = await updateSpecialOperationReport(editingRecord.id, formatted)
        if (r.code === 200) { message.success('已更新'); updateInStore(editingRecord.id, r.data as SpecialOperationReport); setModalVisible(false) }
        else { message.error(r.message || '更新失败') }
      } else {
        const r = await createSpecialOperationReport(formatted as SpecialOperationReportFormData)
        if (r.code === 200) { message.success('已创建'); addSpecialOpReport(r.data as SpecialOperationReport); setModalVisible(false); form.resetFields() }
        else { message.error(r.message || '创建失败') }
      }
    } catch { /* form validation */ }
  }

  const handleFlowSubmit = async (id: string) => {
    const r = await submitSpecialOperationReport(id)
    if (r.code === 200) {
      const item = r.data as SpecialOperationReport
      updateInStore(id, item)
      if (item.is_critical) {
        message.success(`已提交 · AI判定为关键作业${item.is_critical_reason ? `（${item.is_critical_reason}）` : ''}`)
      } else {
        message.success(`已提交${item.is_critical_reason ? ` · ${item.is_critical_reason}` : ''}`)
      }
    }
    else { message.error(r.message || '提交失败') }
  }

  const handleApprove = async (id: string) => {
    const r = await approveSpecialOperationReport(id)
    if (r.code === 200) { message.success('已审批'); updateInStore(id, r.data as SpecialOperationReport) }
    else { message.error(r.message || '审批失败') }
  }

  const handleOpenReject = (id: string) => { setRejectId(id); setRejectReason(''); setRejectVisible(true) }

  const handleReject = async () => {
    if (!rejectReason.trim()) { message.error('请填写驳回原因'); return }
    const r = await rejectSpecialOperationReport(rejectId, rejectReason)
    if (r.code === 200) { message.success('已驳回'); updateInStore(rejectId, r.data as SpecialOperationReport); setRejectVisible(false) }
    else { message.error(r.message || '驳回失败') }
  }

  const handleToggleCritical = async (id: string, checked: boolean) => {
    const r = await setSpecialOperationReportCritical(id, checked)
    if (r.code === 200) { message.success(checked ? '已标记为关键作业' : '已取消关键作业标记'); updateInStore(id, r.data as SpecialOperationReport) }
    else { message.error(r.message || '操作失败') }
  }

  // ── Table columns ──
  const columns: ColumnsType<SpecialOperationReport> = [
    {
      title: '报备编号', dataIndex: 'report_no', key: 'report_no', width: 130,
      render: (v) => <Text style={{ fontWeight: 500, color: T.charcoal, fontFamily: 'monospace', fontSize: 13 }}>{v}</Text>,
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
        const label = OP_LEVEL_OPTIONS.find(o => o.value === v)?.label || v
        const color = v === 'special' ? T.error : v === 'grade1' ? T.warning : v === 'not_applicable' ? T.steel : T.slate
        return <Text style={{ color, fontSize: 13 }}>{label}</Text>
      },
    },
    {
      title: '地点', dataIndex: 'location', key: 'location', width: 110, ellipsis: true,
      render: (v) => <Text style={{ color: T.steel, fontSize: 13 }}>{v || '-'}</Text>,
    },
    {
      title: '作业内容', dataIndex: 'work_description', key: 'desc', width: 140, ellipsis: true,
      render: (v) => <Tooltip title={v}><Text style={{ fontSize: 13 }}>{v || '-'}</Text></Tooltip>,
    },
    {
      title: '部门', dataIndex: 'department', key: 'dept', width: 80, ellipsis: true,
      render: (v) => <Text style={{ color: T.steel, fontSize: 13 }}>{v || '-'}</Text>,
    },
    {
      title: '关键作业', dataIndex: 'is_critical', key: 'critical', width: 90,
      render: (v: boolean, record) => (
        <Switch
          checked={v} size="small"
          onChange={(checked) => handleToggleCritical(record.id, checked)}
          checkedChildren="是" unCheckedChildren="否"
        />
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => {
        const tag = STATUS_TAG[s] || { color: T.steel, bg: T.surface, label: s }
        return <Tag style={{ color: tag.color, backgroundColor: tag.bg, border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12 }}>{tag.label}</Tag>
      },
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 110,
      render: (v: string) => <Text style={{ color: T.steel, fontSize: 12 }}>{v ? dayjs(v).format('MM-DD HH:mm') : '-'}</Text>,
    },
    {
      title: '操作', key: 'action', width: 260, fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<SendOutlined />}
              style={{ color: T.primary, padding: '0 4px' }}
              onClick={() => handleFlowSubmit(record.id)}
            >提交</Button>
          )}
          {record.status === 'submitted' && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />}
                style={{ color: T.success, padding: '0 4px' }}
                onClick={() => handleApprove(record.id)}
              >审批</Button>
              <Button type="link" size="small" icon={<CloseCircleOutlined />}
                style={{ color: T.error, padding: '0 4px' }}
                onClick={() => handleOpenReject(record.id)}
              >驳回</Button>
            </>
          )}
          <Button type="link" size="small" icon={<EditOutlined />}
            style={{ color: '#0075de', padding: '0 4px' }}
            onClick={() => handleEdit(record)}
          >编辑</Button>
          <Button type="link" size="small" icon={<DeleteOutlined />}
            style={{ color: T.error, padding: '0 4px' }}
            onClick={() => handleDelete(record.id)}
          >删除</Button>
        </Space>
      ),
    },
  ]

  // ── Shared styles ──
  const cardStyle: React.CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${T.hairline}`,
    backgroundColor: T.canvas,
  }

  // ── Form content for modal ──
  const formContent = (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="report_no" label="报备编号" rules={[{ required: true, message: '请输入报备编号' }]}>
            <Input placeholder="报备编号" style={{ borderRadius: 8, height: 44 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="operation_type" label="作业类型" rules={[{ required: true, message: '请选择作业类型' }]}>
            <Select
              options={Object.entries(OP_TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
              placeholder="选择作业类型"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="operation_level" label="作业级别" initialValue="grade2">
            <Select options={OP_LEVEL_OPTIONS} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="department" label="报备部门">
            <Input placeholder="部门" style={{ borderRadius: 8, height: 44 }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="location" label="作业地点">
            <Input placeholder="地点" style={{ borderRadius: 8, height: 44 }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="applicant_name" label="申请人">
            <Input placeholder="申请人" style={{ borderRadius: 8, height: 44 }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="planned_start_time" label="计划开始">
            <DatePicker showTime style={{ width: '100%', borderRadius: 8, height: 44 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="planned_end_time" label="计划结束">
            <DatePicker showTime style={{ width: '100%', borderRadius: 8, height: 44 }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="work_description" label="作业内容描述">
        <TextArea rows={2} placeholder="作业内容描述" style={{ borderRadius: 8 }} />
      </Form.Item>
      <Form.Item name="notes" label="备注">
        <TextArea rows={2} placeholder="备注" style={{ borderRadius: 8 }} />
      </Form.Item>
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text strong style={{ fontSize: 18, color: T.ink }}>特殊作业报备</Text>
          <div style={{ color: T.slate, fontSize: 13, marginTop: 2 }}>GB 30871-2022 · 8类特殊作业报备审批</div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
        >
          新建报备
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <Card
        variant="borderless"
        style={cardStyle}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space wrap size="middle">
          <Input
            placeholder="搜索编号/内容/地点"
            prefix={<SearchOutlined style={{ color: T.muted }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            style={{ width: 220, borderRadius: 8, height: 44, backgroundColor: T.surface, border: `1px solid ${T.hairline}` }}
          />
          <Select
            placeholder="作业类型" allowClear value={typeFilter}
            onChange={v => { setTypeFilter(v); setSpecialOpReportQueryParams({ page: 1 }) }}
            style={{ width: 130, borderRadius: 8 }}
            options={Object.entries(OP_TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <Select
            placeholder="状态" allowClear value={statusFilter}
            onChange={v => { setStatusFilter(v); setSpecialOpReportQueryParams({ page: 1 }) }}
            style={{ width: 110, borderRadius: 8 }}
            options={REPORT_STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          />
          <Button
            icon={<SearchOutlined />}
            onClick={handleSearch}
            style={{ borderRadius: 8 }}
          >
            查询
          </Button>
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
          dataSource={specialOpReports}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          size="middle"
          pagination={{
            current: specialOpReportQueryParams.page,
            pageSize: specialOpReportQueryParams.page_size,
            total: specialOpReportTotal,
            showSizeChanger: true,
            showTotal: t => <Text style={{ color: T.steel }}>共 {t} 条</Text>,
            onChange: (page, pageSize) => setSpecialOpReportQueryParams({ page, page_size: pageSize }),
          }}
        />
      </Card>

      {/* ── Create/Edit Modal ── */}
      <Modal
        title={editingRecord ? '编辑报备' : '新建报备'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={850}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <Form form={editingRecord ? editForm : form} layout="vertical">{formContent}</Form>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal
        title="驳回原因"
        open={rejectVisible}
        onOk={handleReject}
        onCancel={() => setRejectVisible(false)}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{
          style: { borderRadius: 8, backgroundColor: T.error, borderColor: T.error },
        }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <TextArea
          rows={4}
          placeholder="请输入驳回原因"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          style={{ borderRadius: 8 }}
        />
      </Modal>
    </div>
  )
}
