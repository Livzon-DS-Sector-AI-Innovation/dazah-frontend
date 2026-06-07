'use client'

import { useCallback, useEffect } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { DeviationTable } from './DeviationTable'
import { useDeviationStore } from '@/stores/quality'
import { fetchDeviations } from '@/lib/api/quality'
import Link from 'next/link'

export function DeviationPage() {
  const {
    setDeviations,
    setTotal,
    setLoading,
    loading,
    page,
    pageSize,
    statusFilter,
    levelFilter,
    departmentFilter,
    keyword,
  } = useDeviationStore()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchDeviations({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        level: levelFilter || undefined,
        department: departmentFilter || undefined,
        keyword: keyword || undefined,
      })
      setDeviations(result.items)
      setTotal(result.total)
    } catch (error) {
      console.warn('加载偏差数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, levelFilter, departmentFilter, keyword, setDeviations, setTotal, setLoading])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>偏差管理</h1>
        <Link href="/quality/deviations/new">
          <Button type="primary" icon={<PlusOutlined />}>
            新建偏差
          </Button>
        </Link>
      </div>
      <DeviationTable loading={loading} onRefresh={loadData} />
    </div>
  )
}
