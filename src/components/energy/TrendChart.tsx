'use client'

import { Card, Radio } from 'antd'
import { Line } from '@ant-design/charts'
import { useState } from 'react'
import { TrendDataPoint } from '@/types/energy'

interface TrendChartProps {
  data: TrendDataPoint[]
  loading?: boolean
}

export function TrendChart({ data, loading = false }: TrendChartProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

  const config = {
    data,
    xField: 'time',
    yField: 'value',
    colorField: 'type',
    shapeField: 'smooth',
    scale: {
      y: {
        domainMin: 0,
      },
    },
    axis: {
      y: {
        title: {
          text: '消耗量',
        },
      },
    },
    legend: {
      position: 'top' as const,
    },
    interaction: {
      tooltip: {
        marker: false,
      },
    },
    point: {
      shapeField: 'circle',
      sizeField: 3,
    },
  }

  return (
    <Card
      title="能耗趋势"
      loading={loading}
      extra={
        <Radio.Group
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <Radio.Button value="week">近7天</Radio.Button>
          <Radio.Button value="month">近30天</Radio.Button>
        </Radio.Group>
      }
    >
      <Line {...config} height={300} />
    </Card>
  )
}
