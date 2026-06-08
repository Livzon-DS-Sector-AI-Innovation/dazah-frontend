'use client'

import { Card, Statistic, Row, Col } from 'antd'
import {
  ThunderboltOutlined,
  CloudOutlined,
  FireOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { EnergyStatistics } from '@/types/energy'

interface StatsCardsProps {
  statistics: EnergyStatistics
  loading?: boolean
}

export function StatsCards({ statistics, loading = false }: StatsCardsProps) {
  const cards = [
    {
      title: '电力消耗',
      value: statistics.total_electricity,
      suffix: 'kWh',
      change: statistics.electricity_change,
      icon: <ThunderboltOutlined />,
      color: '#1890ff',
    },
    {
      title: '水消耗',
      value: statistics.total_water,
      suffix: 'm³',
      change: statistics.water_change,
      icon: <CloudOutlined />,
      color: '#52c41a',
    },
    {
      title: '气体消耗',
      value: statistics.total_gas,
      suffix: 'm³',
      change: statistics.gas_change,
      icon: <FireOutlined />,
      color: '#fa8c16',
    },
    {
      title: '总成本',
      value: statistics.total_cost,
      suffix: '¥',
      change: statistics.cost_change,
      icon: <DollarOutlined />,
      color: '#f5222d',
    },
  ]

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col xs={24} sm={12} lg={6} key={card.title}>
          <Card loading={loading}>
            <Statistic
              title={card.title}
              value={card.value}
              suffix={card.suffix}
              precision={2}
              styles={{ content: { color: card.color } }}
              prefix={card.icon}
            />
            <div className="mt-2 text-sm">
              <span
                className={
                  card.change >= 0 ? 'text-red-500' : 'text-green-500'
                }
              >
                {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change).toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-2">较昨日</span>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
