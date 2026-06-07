'use client'

import { useCallback, useEffect } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { CapaTable } from './CapaTable'
import { useCapaStore } from '@/stores/quality'
import { fetchCapas } from '@/lib/api/quality'
import Link from 'next/link'

export function CapaPage() {
  const {
    setCapas,
    setTotal,
    setLoading,
    loading,
    page,
    pageSize,
    statusFilter,
    sourceFilter,
    categoryFilter,
    keyword,
  } = useCapaStore()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchCapas({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        category: categoryFilter || undefined,
        keyword: keyword || undefined,
      })
      setCapas(result.items)
      setTotal(result.total)
    } catch (error) {
      console.warn('加载CAPA数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, sourceFilter, categoryFilter, keyword, setCapas, setTotal, setLoading])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>CAPA管理</h1>
        <Link href="/quality/capas/new">
          <Button type="primary" icon={<PlusOutlined />}>
            新建CAPA
          </Button>
        </Link>
      </div>
      <CapaTable loading={loading} onRefresh={loadData} />
    </div>
  )
}
