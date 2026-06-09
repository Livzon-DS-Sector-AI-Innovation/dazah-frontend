"use client"

'use client'

import { useState, useEffect } from 'react'
import { Button, Space, message } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { AlertRuleTable } from '@/components/energy'
import { AlertRule } from '@/types/energy'

export default function AlertsPage() {
  const [data, setData] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      // TODO: 调用API获取预警规则列表
      // 临时使用模拟数据
      const mockData: AlertRule[] = [
        {
          id: '1',
          rule_name: '电力消耗过高预警',
          energy_type: 'electricity',
          monitor_metric: 'daily_total',
          threshold_type: 'greater_than',
          threshold_value: 1000,
          unit: 'kWh',
          alert_level: 'warning',
          notify_method: ['email'],
          notify_users: ['admin'],
          notify_frequency: 'first',
          effective_time: 'all_day',
          is_enabled: true,
          created_at: '2024-01-15 10:30:00',
          updated_at: '2024-01-15 10:30:00',
        },
        {
          id: '2',
          rule_name: '水消耗异常预警',
          energy_type: 'water',
          monitor_metric: 'instant',
          threshold_type: 'greater_than',
          threshold_value: 50,
          unit: 'm³',
          alert_level: 'critical',
          notify_method: ['sms', 'email'],
          notify_users: ['admin', 'manager'],
          notify_frequency: 'every',
          effective_time: 'all_day',
          is_enabled: true,
          created_at: '2024-01-16 09:15:00',
          updated_at: '2024-01-16 09:15:00',
        },
      ]
      setData(mockData)
      setTotal(mockData.length)
    } catch (error) {
      message.error('获取预警规则失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEdit = (record: AlertRule) => {
    // TODO: 打开编辑抽屉
    console.log('编辑:', record)
  }

  const handleDelete = async (id: string) => {
    // TODO: 调用API删除预警规则
    console.log('删除:', id)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1
          className="font-semibold"
          style={{ fontSize: 22, color: '#1a1a1a', lineHeight: 1.3 }}
        >
          预警管理
        </h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            新建规则
          </Button>
        </Space>
      </div>

      <AlertRuleTable
        data={data}
        loading={loading}
        total={total}
        onRefresh={fetchData}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
