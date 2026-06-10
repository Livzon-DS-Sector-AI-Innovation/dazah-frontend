'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Space, message } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { AlertRuleTable } from '@/components/energy'
import { AlertRule, PaginatedResponse } from '@/types/energy'
import { getAlertRules, deleteAlertRule } from '@/actions/energy'
import { useEnergyStore } from '@/stores/energy'

export default function AlertsPage() {
  const { alertConfigDrawerOpen, openAlertConfigDrawer } = useEnergyStore()
  const [data, setData] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAlertRules()
      setData(result.items)
      setTotal(result.total)
    } catch (error) {
      message.error('获取预警规则失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEdit = (record: AlertRule) => {
    openAlertConfigDrawer('edit', record.id)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAlertRule(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
    }
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openAlertConfigDrawer('create')}>
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
