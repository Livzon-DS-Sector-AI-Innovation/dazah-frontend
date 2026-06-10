'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  Input,
  Button,
  Space,
  Tag,
  App,
  Typography,
  Modal,
  Descriptions,
  Spin,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  ExportOutlined,
  RobotOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { getHazardIdentifications, parseHazardExportQuery, exportHazardLedgerPdf } from '@/actions/safety'
import type { HazardIdentification, HazardLedgerExportParsedFilters } from '@/types/safety'
import {
  OVERALL_STATUS_OPTIONS_HI,
  RISK_LEVEL_OPTIONS,
} from '@/types/safety'

const { Text } = Typography

export default function HazardLedgerPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HazardIdentification[]>([])
  const [total, setTotal] = useState(0)
  const [queryParams, setQueryParams] = useState({ page: 1, page_size: 20 })
  const [keyword, setKeyword] = useState('')
  const [department, setDepartment] = useState<string | undefined>()
  const { message } = App.useApp()

  // ── AI 导出 Modal 状态 ──
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [naturalQuery, setNaturalQuery] = useState('')
  const [aiParsing, setAiParsing] = useState(false)
  const [parsedFilters, setParsedFilters] = useState<HazardLedgerExportParsedFilters | null>(null)
  const [exporting, setExporting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getHazardIdentifications({
        ...queryParams,
        overall_status: 'completed',
        keyword: keyword || undefined,
        department,
      })
      if (res.code === 200) {
        setData(res.data as HazardIdentification[])
        setTotal(res.meta?.total || 0)
      }
    } catch {
      message.error('加载台账失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [queryParams])

  const handleSearch = () => {
    setQueryParams({ page: 1, page_size: queryParams.page_size })
    loadData()
  }

  // ── AI 解析 ──
  const handleAiParse = async () => {
    if (!naturalQuery.trim()) {
      message.warning('请输入筛选条件描述')
      return
    }
    setAiParsing(true)
    setParsedFilters(null)
    try {
      const res = await parseHazardExportQuery(naturalQuery.trim())
      if (res.code === 200 && res.data) {
        setParsedFilters(res.data as HazardLedgerExportParsedFilters)
        message.success('AI 解析完成')
      } else {
        message.error(res.message || 'AI 解析失败')
      }
    } catch {
      message.error('AI 解析请求失败')
    } finally {
      setAiParsing(false)
    }
  }

  // ── 导出 PDF ──
  const handleExportPdf = async () => {
    setExporting(true)
    try {
      await exportHazardLedgerPdf({
        natural_query: naturalQuery.trim() || undefined,
      })
      message.success('PDF 导出成功')
      setExportModalOpen(false)
    } catch {
      message.error('PDF 导出失败')
    } finally {
      setExporting(false)
    }
  }

  // ── 关闭弹窗时重置状态 ──
  const handleCloseExportModal = () => {
    setExportModalOpen(false)
    setNaturalQuery('')
    setParsedFilters(null)
  }

  const getRiskTag = (level?: string, label?: string) => {
    if (!level) return '-'
    const opt = RISK_LEVEL_OPTIONS.find((o) => o.value === level)
    return <Tag color={opt?.color}>{label || level}</Tag>
  }

  const getControlLevelTag = (level?: string) => {
    if (!level) return '-'
    const colorMap: Record<string, string> = {
      '公司级': 'red',
      '部门级': 'orange',
      '班组级': 'blue',
    }
    return <Tag color={colorMap[level] || 'default'}>{level}</Tag>
  }

  const columns: ColumnsType<HazardIdentification> = [
    { title: '编号', dataIndex: 'hazard_id_no', key: 'hazard_id_no', width: 120 },
    { title: '部门', dataIndex: 'department', key: 'department', width: 100, ellipsis: true },
    { title: '岗位', dataIndex: 'position', key: 'position', width: 100, ellipsis: true },
    {
      title: '作业活动', dataIndex: 'specific_activity', key: 'specific_activity', width: 160, ellipsis: true,
      render: (v?: string) => v || '-',
    },
    {
      title: '固有风险', key: 'inherent_risk', width: 100,
      render: (_, r) => getRiskTag(r.inherent_risk_level, r.inherent_risk_label),
    },
    {
      title: '残余风险', key: 'residual_risk', width: 100,
      render: (_, r) => getRiskTag(r.residual_risk_level, r.residual_risk_label),
    },
    {
      title: '管控层级', dataIndex: 'control_level', key: 'control_level', width: 90,
      render: (v?: string) => getControlLevelTag(v),
    },
    { title: '责任人', dataIndex: 'responsible_person', key: 'responsible_person', width: 90, ellipsis: true },
    {
      title: '控制措施', key: 'controls', width: 300, ellipsis: true,
      render: (_, r) => (
        <div style={{ fontSize: 12, lineHeight: 1.4, maxWidth: 280 }}>
          {r.existing_engineering_controls && (
            <div><Text type="secondary">工程：</Text>{r.existing_engineering_controls}</div>
          )}
          {r.existing_management_controls && (
            <div><Text type="secondary">管理：</Text>{r.existing_management_controls}</div>
          )}
          {r.existing_ppe && (
            <div><Text type="secondary">PPE：</Text>{r.existing_ppe}</div>
          )}
          {r.existing_emergency_measures && (
            <div><Text type="secondary">应急：</Text>{r.existing_emergency_measures}</div>
          )}
          {!r.existing_engineering_controls && !r.existing_management_controls &&
            !r.existing_ppe && !r.existing_emergency_measures && '-'}
        </div>
      ),
    },
    {
      title: '操作', key: 'action', width: 80, fixed: 'right',
      render: (_, r) => (
        <Button
          type="link"
          size="small"
          onClick={() => router.push(`/safety/hazard-identification/${r.id}`)}
        >
          查看
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
            危险源辨识台账
          </h1>
          <p style={{ fontSize: 14, color: '#5d5b54', margin: '4px 0 0' }}>
            已完成危险源辨识记录的只读台账
          </p>
        </div>
        <Button
          icon={<ExportOutlined />}
          onClick={() => setExportModalOpen(true)}
        >
          AI 导出 PDF
        </Button>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#f6f5f4', borderRadius: 12, border: '1px solid #e5e3df',
        padding: '16px 20px', marginBottom: 16,
      }}>
        <Space wrap>
          <Input
            placeholder="搜索编号/部门/岗位"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
            allowClear
          />
          <Input
            placeholder="部门"
            value={department}
            onChange={(e) => setDepartment(e.target.value || undefined)}
            onPressEnter={handleSearch}
            style={{ width: 140 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
        </Space>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 12, border: '1px solid #e5e3df', padding: 16, background: '#fff' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          size="small"
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.page_size,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setQueryParams({ page, page_size: pageSize }),
          }}
        />
      </div>

      {/* ── AI 导出 PDF Modal ── */}
      <Modal
        title={
          <span>
            <RobotOutlined style={{ marginRight: 8, color: '#5645D4' }} />
            AI 智能导出 PDF
          </span>
        }
        open={exportModalOpen}
        onCancel={handleCloseExportModal}
        width={560}
        footer={[
          <Button key="cancel" onClick={handleCloseExportModal}>
            取消
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={handleExportPdf}
            disabled={aiParsing}
          >
            导出 PDF
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 自然语言输入 */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              用自然语言描述要导出哪些记录：
            </Text>
            <Input.TextArea
              placeholder={'例如：\n- "上月所有重大风险记录"\n- "合成岗位最近三个月的数据"\n- "生产部一级和二级风险的危险源"'}
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              rows={3}
              onPressEnter={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  handleAiParse()
                }
              }}
            />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              也可以直接点击「导出 PDF」，系统将导出全部已完成记录
            </Text>
          </div>

          {/* AI 解析按钮 */}
          <Button
            icon={<RobotOutlined />}
            onClick={handleAiParse}
            loading={aiParsing}
            style={{ alignSelf: 'flex-start' }}
          >
            AI 解析筛选条件
          </Button>

          {/* 解析结果 */}
          {aiParsing && (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Spin tip="AI 正在解析筛选条件..." />
            </div>
          )}

          {parsedFilters && (
            <div
              style={{
                background: '#f0f5ff',
                borderRadius: 8,
                border: '1px solid #d6e4ff',
                padding: '12px 16px',
              }}
            >
              <Text strong style={{ color: '#5645D4', display: 'block', marginBottom: 8 }}>
                AI 解析结果
              </Text>
              {parsedFilters.explanation && (
                <Text style={{ fontSize: 13, color: '#5d5b54', display: 'block', marginBottom: 8 }}>
                  "{parsedFilters.explanation}"
                </Text>
              )}
              <Descriptions size="small" column={2}>
                {parsedFilters.department && (
                  <Descriptions.Item label="部门">{parsedFilters.department}</Descriptions.Item>
                )}
                {parsedFilters.position && (
                  <Descriptions.Item label="岗位">{parsedFilters.position}</Descriptions.Item>
                )}
                {parsedFilters.risk_level && (
                  <Descriptions.Item label="风险等级">
                    <Tag>
                      {RISK_LEVEL_OPTIONS.find((o) => o.value === parsedFilters.risk_level)?.label || parsedFilters.risk_level}
                    </Tag>
                  </Descriptions.Item>
                )}
                {parsedFilters.date_from && (
                  <Descriptions.Item label="日期起">{parsedFilters.date_from}</Descriptions.Item>
                )}
                {parsedFilters.date_to && (
                  <Descriptions.Item label="日期止">{parsedFilters.date_to}</Descriptions.Item>
                )}
                {parsedFilters.keyword && (
                  <Descriptions.Item label="关键词">{parsedFilters.keyword}</Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
