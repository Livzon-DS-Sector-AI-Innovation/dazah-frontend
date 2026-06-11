'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Table, Card, Row, Col, Statistic, Input, Select, DatePicker, Button, Space, Tag, message,
} from 'antd'
import {
  FileTextOutlined, PlusOutlined, EyeOutlined, ReloadOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import {
  RegulatoryDocument, SummaryStats, DocumentListParams,
  fetchSummary, fetchDocuments, markDocumentRead,
} from '@/lib/api/regulatory-tracker-client'

const { Search } = Input
const { RangePicker } = DatePicker

export default function RegulatoryTrackerPage() {
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [documents, setDocuments] = useState<RegulatoryDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 搜索条件
  const [keyword, setKeyword] = useState('')
  const [classification, setClassification] = useState<string | undefined>(undefined)
  const [statusText, setStatusText] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [isNew, setIsNew] = useState<boolean | undefined>(undefined)

  // 加载统计数据
  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchSummary()
      setSummary(data)
    } catch {
      message.error('加载统计数据失败')
    }
  }, [])

  // 加载文档列表
  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params: DocumentListParams = {
        page,
        pageSize,
      }

      if (keyword) params.keyword = keyword
      if (classification) params.classification = classification
      if (statusText) params.statusText = statusText
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.publishDateFrom = dateRange[0].format('YYYY-MM-DD')
        params.publishDateTo = dateRange[1].format('YYYY-MM-DD')
      }
      if (isNew !== undefined) params.isNew = isNew

      const data = await fetchDocuments(params)
      setDocuments(data.items)
      setTotal(data.total)
    } catch {
      message.error('加载文档列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, classification, statusText, dateRange, isNew])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // 查看原文
  const handleViewOriginal = async (record: RegulatoryDocument) => {
    if (record.originalUrl) {
      window.open(record.originalUrl, '_blank')
      
      // 标记为已读
      if (record.isNew) {
        try {
          await markDocumentRead(record.id)
          message.success('已标记为已读')
          loadDocuments()
          loadSummary()
        } catch {
          message.error('标记已读失败')
        }
      }
    }
  }

  // 重置搜索
  const handleReset = () => {
    setKeyword('')
    setClassification(undefined)
    setStatusText(undefined)
    setDateRange(null)
    setIsNew(undefined)
    setPage(1)
  }

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: '40%',
      render: (text: string, record: RegulatoryDocument) => (
        <div>
          <span className="font-medium">{text}</span>
          {record.isNew && (
            <Tag color="red" className="ml-2">NEW</Tag>
          )}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'classification',
      key: 'classification',
      width: '15%',
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'statusText',
      key: 'statusText',
      width: '10%',
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: '发布日期',
      dataIndex: 'publishDate',
      key: 'publishDate',
      width: '12%',
      render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD') : '-',
    },
    {
      title: '首次发现',
      dataIndex: 'firstFoundAt',
      key: 'firstFoundAt',
      width: '13%',
      render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: '10%',
      render: (_: unknown, record: RegulatoryDocument) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewOriginal(record)}
        >
          查看原文
        </Button>
      ),
    },
  ]

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[var(--color-charcoal)] mb-2">
          法规跟踪
        </h1>
        <p className="text-[14px] text-[var(--color-steel)]">
          CDE 国内药品技术指导原则实时监控
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="法规总数"
              value={summary?.totalCount || 0}
              prefix={<FileTextOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={summary?.todayNewCount || 0}
              prefix={<PlusOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="未读法规"
              value={summary?.unreadNewCount || 0}
              prefix={<EyeOutlined />}
              styles={{ content: { color: '#faad14' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="最近同步"
              value={
                summary?.lastSyncTime
                  ? dayjs(summary.lastSyncTime).format('MM-DD HH:mm')
                  : '暂无'
              }
              prefix={<ReloadOutlined />}
              styles={{ content: { color: '#722ed1', fontSize: '20px' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Search
              placeholder="搜索标题关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={() => setPage(1)}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              placeholder="选择分类"
              value={classification}
              onChange={(value) => {
                setClassification(value)
                setPage(1)
              }}
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: '化学药', value: '化学药' },
                { label: '生物制品', value: '生物制品' },
                { label: '中药', value: '中药' },
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              placeholder="选择状态"
              value={statusText}
              onChange={(value) => {
                setStatusText(value)
                setPage(1)
              }}
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: '颁布', value: '颁布' },
                { label: '征求意见', value: '征求意见' },
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as [Dayjs | null, Dayjs | null] | null)
                setPage(1)
              }}
              style={{ width: '100%' }}
              placeholder={['发布日期开始', '发布日期结束']}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              placeholder="新增状态"
              value={isNew}
              onChange={(value) => {
                setIsNew(value)
                setPage(1)
              }}
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: '新增', value: true },
                { label: '已读', value: false },
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <Button type="primary" onClick={() => setPage(1)}>
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 文档列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPage(page)
              setPageSize(pageSize)
            },
          }}
        />
      </Card>
    </div>
  )
}
