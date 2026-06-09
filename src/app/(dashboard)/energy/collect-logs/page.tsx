"use client"

'use client'

import { useEffect, useState, useCallback } from 'react'
import { App, Button, Select, DatePicker, Space, Spin, Card, Row, Col, Statistic } from 'antd'
import { ExportOutlined, ThunderboltOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useEnergyStore } from '@/stores/energy'
import { CollectLogTable } from '@/components/energy/CollectLogTable'
import { getCollectLogs, triggerCollect } from '@/actions/energy'
import { CollectLog, PaginatedResponse } from '@/types/energy'

const { RangePicker } = DatePicker

export default function CollectLogsPage() {
  const { message } = App.useApp()
  const { logFilters, setLogFilters, resetLogFilters } = useEnergyStore()

  const [loading, setLoading] = useState(false)
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<CollectLog>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCollectLogs(logFilters)
      setData(result)
    } catch (error) {
      console.error('获取采集日志失败:', error)
      message.error('获取采集日志失败')
    } finally {
      setLoading(false)
    }
  }, [logFilters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTriggerCollect = async () => {
    setTriggerLoading(true)
    try {
      await triggerCollect()
      message.success('采集任务已触发')
      fetchData()
    } catch (error) {
      message.error('触发采集失败')
    } finally {
      setTriggerLoading(false)
    }
  }

  const handleRetry = async (configId: string) => {
    try {
      await triggerCollect([configId])
      message.success('重试任务已触发')
      fetchData()
    } catch (error) {
      message.error('触发重试失败')
    }
  }

  // 计算统计信息
  const stats = {
    total: data.total,
    successRate:
      data.items.length > 0
        ? (
            (data.items.filter((item) => item.status === 'success').length /
              data.items.length) *
            100
          ).toFixed(1)
        : '0',
    avgDuration:
      data.items.length > 0
        ? Math.round(
            data.items
              .filter((item) => item.duration !== undefined)
              .reduce((sum, item) => sum + (item.duration || 0), 0) /
              data.items.filter((item) => item.duration !== undefined).length
          )
        : 0,
    failedCount: data.items.filter((item) => item.status === 'failed').length,
  }

  return (
    <div className="p-6">
      <h1
        className="font-semibold mb-4"
        style={{ fontSize: 22, color: '#1a1a1a', lineHeight: 1.3 }}
      >
        采集日志
      </h1>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="今日采集总数" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成功率"
              value={stats.successRate}
              suffix="%"
              styles={{
                content: {
                  color: Number(stats.successRate) >= 90 ? '#3f8600' : '#cf1322',
                },
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="平均耗时" value={stats.avgDuration} suffix="ms" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="失败设备数"
              value={stats.failedCount}
              styles={{
                content: {
                  color: stats.failedCount > 0 ? '#cf1322' : '#3f8600',
                },
              }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div
        style={{
          background: '#ffffff',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e3df',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <Space>
            <Select
              placeholder="采集状态"
              style={{ width: 120 }}
              value={logFilters.status}
              onChange={(value) => setLogFilters({ status: value })}
              allowClear
              options={[
                { label: '成功', value: 'success' },
                { label: '失败', value: 'failed' },
                { label: '超时', value: 'timeout' },
              ]}
            />
            <RangePicker
              value={
                logFilters.start_time && logFilters.end_time
                  ? [dayjs(logFilters.start_time), dayjs(logFilters.end_time)]
                  : undefined
              }
              onChange={(dates) => {
                if (dates) {
                  setLogFilters({
                    start_time: dates[0]?.toISOString(),
                    end_time: dates[1]?.toISOString(),
                  })
                } else {
                  setLogFilters({
                    start_time: undefined,
                    end_time: undefined,
                  })
                }
              }}
            />
            <Button onClick={resetLogFilters}>重置</Button>
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleTriggerCollect}
              loading={triggerLoading}
            >
              手动采集
            </Button>
            <Button icon={<ExportOutlined />}>导出</Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          <CollectLogTable
            data={data.items}
            loading={loading}
            total={data.total}
            onRefresh={fetchData}
            onRetry={handleRetry}
          />
        </Spin>
      </div>
    </div>
  )
}
