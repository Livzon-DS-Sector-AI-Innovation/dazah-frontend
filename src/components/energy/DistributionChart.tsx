'use client'

import { Card, Radio } from 'antd'
import { Pie } from '@ant-design/charts'
import { useState } from 'react'
import { DistributionDataPoint } from '@/types/energy'

interface DistributionChartProps {
  data: DistributionDataPoint[]
  loading?: boolean
}

export function DistributionChart({
  data,
  loading = false,
}: DistributionChartProps) {
  const [viewType, setViewType] = useState<'workshop' | 'production_line'>(
    'workshop'
  )

  const total = data.reduce((sum, d) => sum + d.value, 0)

  const config = {
    data,
    angleField: 'value',
    colorField: 'name',
    radius: 0.8,
    innerRadius: 0.5,
    label: {
      text: (d: DistributionDataPoint) => {
        const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
        return `${d.name}: ${pct}%`
      },
      position: 'outside' as const,
      transform: [{ type: 'overlapDodgeY' }],
    },
    legend: {
      color: {
        position: 'bottom' as const,
        title: false,
      },
    },
    tooltip: {
      title: 'name',
      items: [
        (d: DistributionDataPoint) => ({
          name: d.name,
          value: `${d.value.toFixed(2)}`,
        }),
      ],
    },
    interaction: {
      elementHighlight: true,
    },
  }

  return (
    <Card
      title="区域分布"
      loading={loading}
      extra={
        <Radio.Group
          value={viewType}
          onChange={(e) => setViewType(e.target.value)}
        >
          <Radio.Button value="workshop">按车间</Radio.Button>
          <Radio.Button value="production_line">按产线</Radio.Button>
        </Radio.Group>
      }
    >
      <Pie {...config} height={300} />
    </Card>
  )
}
