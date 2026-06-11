'use client'

import { useState, useCallback, useEffect } from 'react'
import { Table, Input, Select, DatePicker, Button, Space, Tag, Card, Statistic, Row, Col, Modal, App } from 'antd'
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, BarChartOutlined } from '@ant-design/icons'
import { LabelVerification } from '@/types/label-verification'
import { fetchLabelVerifications, fetchLabelVerificationStatistics } from '@/lib/api/label-verification'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

interface LabelVerificationClientProps {
  initialVerifications: LabelVerification[]
  initialTotal: number
}

export default function LabelVerificationClient({

  initialVerifications,
  initialTotal,
}: LabelVerificationClientProps) {
  const { message } = App.useApp()

  const [verifications, setVerifications] = useState<LabelVerification[]>(initialVerifications)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [batchNumber, setBatchNumber] = useState('')
  const [productName, setProductName] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<LabelVerification | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchLabelVerifications({
        batch_number: batchNumber || undefined,
        product_name: productName || undefined,
        result_status: filterStatus || undefined,
        start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
        page,
        page_size: pageSize,
      })
      setVerifications(res.data)
      setTotal(res.meta?.total || 0)
    } catch (err: any) {
      message.error(err.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [batchNumber, productName, filterStatus, dateRange, page, pageSize])

  const loadStatistics = useCallback(async () => {
    try {
      const res = await fetchLabelVerificationStatistics()
      setStatistics(res.data)
    } catch (err: any) {
      console.error('加载统计数据失败', err)
    }
  }, [])

  useEffect(() => {
    loadData()
    loadStatistics()
  }, [loadData, loadStatistics])

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage)
    setPageSize(newPageSize)
  }

  const showDetail = (record: LabelVerification) => {
    setSelectedRecord(record)
    setDetailModalOpen(true)
  }

  const columns = [
    {
      title: '批号',
      dataIndex: 'batch_number',
      key: 'batch_number',
      width: 120,
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150,
    },
    {
      title: '生产日期',
      dataIndex: 'production_date',
      key: 'production_date',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '有效期至',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '桶数',
      dataIndex: 'total_barrels',
      key: 'total_barrels',
      width: 80,
      align: 'center' as const,
      render: (val: number, record: LabelVerification) => `${val}桶`,
    },
    {
      title: '总重量',
      dataIndex: 'total_weight',
      key: 'total_weight',
      width: 100,
      align: 'center' as const,
      render: (val: number) => `${val}kg`,
    },
    {
      title: '复核结论',
      dataIndex: 'result_status',
      key: 'result_status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === '全部一致' ? 'success' : 'error'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '复核时间',
      dataIndex: 'verification_time',
      key: 'verification_time',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: LabelVerification) => (
        <Button type="link" size="small" onClick={() => showDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  const CheckItem = ({ label, passed }: { label: string; passed: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      {passed ? (
        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
      ) : (
        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
      )}
      <span>{label}</span>
      <Tag color={passed ? 'success' : 'error'}>{passed ? '一致' : '不一致'}</Tag>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总复核次数"
                value={statistics.total}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="全部一致"
                value={statistics.all_match}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="存在差异"
                value={statistics.has_difference}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="一致率"
                value={statistics.match_rate}
                precision={1}
                suffix="%"
                valueStyle={{ color: statistics.match_rate >= 90 ? '#52c41a' : '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选和表格 */}
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="批号搜索"
            prefix={<SearchOutlined />}
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            style={{ width: 180 }}
            allowClear
          />
          <Input
            placeholder="产品名称搜索"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={{ width: 180 }}
            allowClear
          />
          <Select
            placeholder="结论状态"
            value={filterStatus || undefined}
            onChange={(val) => setFilterStatus(val || '')}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="全部一致">全部一致</Option>
            <Option value="存在差异">存在差异</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as any)}
            placeholder={['复核开始日期', '复核结束日期']}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={verifications}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handlePageChange,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="标签复核详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedRecord && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>批号：</strong>{selectedRecord.batch_number}
              </Col>
              <Col span={12}>
                <strong>产品名称：</strong>{selectedRecord.product_name}
              </Col>
              <Col span={12}>
                <strong>生产日期：</strong>{dayjs(selectedRecord.production_date).format('YYYY-MM-DD')}
              </Col>
              <Col span={12}>
                <strong>有效期至：</strong>{dayjs(selectedRecord.expiry_date).format('YYYY-MM-DD')}
              </Col>
              <Col span={12}>
                <strong>总桶数：</strong>{selectedRecord.total_barrels}桶（整桶{selectedRecord.standard_barrels} + 零头{selectedRecord.remainder_barrel}）
              </Col>
              <Col span={12}>
                <strong>总重量：</strong>{selectedRecord.total_weight}kg
              </Col>
              <Col span={12}>
                <strong>整桶重量：</strong>{selectedRecord.standard_weight}kg
              </Col>
              <Col span={12}>
                <strong>零头重量：</strong>{selectedRecord.remainder_weight}kg
              </Col>
            </Row>

            <div style={{ marginTop: 24, marginBottom: 16 }}>
              <strong>8项核对结论：</strong>
            </div>
            <div style={{ paddingLeft: 8 }}>
              <CheckItem label="1. 标签批号对比" passed={selectedRecord.check_batch_number} />
              <CheckItem label="2. 每桶生产日期对比" passed={selectedRecord.check_production_date} />
              <CheckItem label="3. 每桶有效期至对比" passed={selectedRecord.check_expiry_date} />
              <CheckItem label="4. 整桶数量/桶号/重量对比" passed={selectedRecord.check_standard_barrels} />
              <CheckItem label="5. 零头数量/桶号/重量对比" passed={selectedRecord.check_remainder_barrel} />
              <CheckItem label="6. 总重量对比" passed={selectedRecord.check_total_weight} />
              <CheckItem label="7. 是否识别到每一桶" passed={selectedRecord.check_all_barrels_identified} />
              <CheckItem label="8. 异常处理" passed={selectedRecord.check_exception_handled} />
            </div>

            <div style={{ marginTop: 24 }}>
              <strong>总体结论：</strong>
              <Tag color={selectedRecord.result_status === '全部一致' ? 'success' : 'error'} style={{ marginLeft: 8 }}>
                {selectedRecord.result_summary}
              </Tag>
            </div>

            {selectedRecord.video_file_name && (
              <div style={{ marginTop: 16 }}>
                <strong>视频来源：</strong>{selectedRecord.video_file_name}
                {selectedRecord.video_frame_count && ` (${selectedRecord.video_frame_count}帧 @ ${selectedRecord.video_fps}fps)`}
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <strong>复核时间：</strong>{dayjs(selectedRecord.verification_time).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
