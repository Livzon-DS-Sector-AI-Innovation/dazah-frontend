'use client'

import { useEffect, useState, useCallback } from 'react'
import { App, Row, Col, Select, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { StatsCards } from './StatsCards'
import { TrendChart } from './TrendChart'
import { DistributionChart } from './DistributionChart'
import { useEnergyStore } from '@/stores/energy'
import {
  EnergyStatistics,
  TrendDataPoint,
  DistributionDataPoint,
} from '@/types/energy'
import { fetchEnergyStatisticsClient } from '@/lib/api/energy'

export function EnergyOverview() {
  const { message } = App.useApp()
  const {
    overviewTimeRange,
    setOverviewTimeRange,
    selectedEnergyType,
    setSelectedEnergyType,
  } = useEnergyStore()

  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<EnergyStatistics>({
    total_electricity: 0,
    total_water: 0,
    total_gas: 0,
    total_cost: 0,
    electricity_change: 0,
    water_change: 0,
    gas_change: 0,
    cost_change: 0,
  })
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [distributionData, setDistributionData] = useState<
    DistributionDataPoint[]
  >([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 计算时间范围
      const now = new Date()
      let startTime: string | undefined
      if (overviewTimeRange === 'today') {
        startTime = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      } else if (overviewTimeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startTime = weekAgo.toISOString()
      } else {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        startTime = monthAgo.toISOString()
      }

      const [stats] = await Promise.all([
        fetchEnergyStatisticsClient({ start_time: startTime }),
      ])

      setStatistics(stats)

      // TODO: 从API获取趋势数据和分布数据（后端接口待对接）
      setTrendData([])
      setDistributionData([])
    } catch (error) {
      console.error('获取能源数据失败:', error)
      message.error('获取能源数据失败')
    } finally {
      setLoading(false)
    }
  }, [overviewTimeRange, message])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={overviewTimeRange}
            onChange={setOverviewTimeRange}
            style={{ width: 120 }}
            options={[
              { label: '今日', value: 'today' },
              { label: '近7天', value: 'week' },
              { label: '近30天', value: 'month' },
            ]}
          />
          <Select
            value={selectedEnergyType}
            onChange={setSelectedEnergyType}
            style={{ width: 120 }}
            options={[
              { label: '全部', value: 'all' },
              { label: '电力', value: 'electricity' },
              { label: '水', value: 'water' },
              { label: '气体', value: 'gas' },
            ]}
          />
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <StatsCards statistics={statistics} loading={loading} />

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={12}>
          <TrendChart data={trendData} loading={loading} />
        </Col>
        <Col xs={24} lg={12}>
          <DistributionChart data={distributionData} loading={loading} />
        </Col>
      </Row>
    </div>
  )
}
