'use client'

import { useEffect, useCallback, useState } from 'react'
import { App, ConfigProvider, Tabs, Button, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { EquipmentCategory, Location, Equipment, EquipmentStatistics } from '@/types/equipment'
import { useEquipmentStore } from '@/stores/equipment'
import { antdTheme } from '@/lib/antd-theme'
import { fetchEquipmentsClient, fetchEquipmentStatisticsClient } from '@/lib/api/equipment-client'
import { StatsCards } from './StatsCards'
import { EquipmentTable } from './EquipmentTable'
import { CategoryTree } from './CategoryTree'
import { LocationTree } from './LocationTree'
import { EquipmentDrawer } from './EquipmentDrawer'
import { CategoryDrawer } from './CategoryDrawer'
import { LocationDrawer } from './LocationDrawer'
import { RepairDrawer } from './RepairDrawer'

interface EquipmentPageProps {
  initialCategories: EquipmentCategory[]
  initialLocations: Location[]
  initialEquipments: Equipment[]
  initialTotal: number
  initialStatistics: EquipmentStatistics
}

const SIDEBAR_WIDTH = 280

export function EquipmentPage({
  initialCategories,
  initialLocations,
  initialEquipments,
  initialTotal,
  initialStatistics,
}: EquipmentPageProps) {
  const {
    categories,
    locations,
    statistics,
    selectedCategory,
    selectedLocation,
    statusFilter,
    keyword,
    page,
    pageSize,
    loading,
    setCategories,
    setLocations,
    setEquipments,
    setStatistics,
    setTotal,
    setLoading,
  } = useEquipmentStore()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 初始化数据
  useEffect(() => {
    setCategories(initialCategories)
    setLocations(initialLocations)
    setEquipments(initialEquipments)
    setStatistics(initialStatistics)
    setTotal(initialTotal)
  }, [initialCategories, initialLocations, initialEquipments, initialStatistics, initialTotal, setCategories, setLocations, setEquipments, setStatistics, setTotal])

  // 筛选/翻页时重新获取数据
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [equipmentsResponse, stats] = await Promise.all([
        fetchEquipmentsClient({
          category_id: selectedCategory,
          location_id: selectedLocation,
          status: statusFilter || undefined,
          keyword: keyword || undefined,
          page,
          page_size: pageSize,
        }),
        fetchEquipmentStatisticsClient(),
      ])
      setEquipments(equipmentsResponse.items)
      setTotal(equipmentsResponse.total)
      setStatistics(stats)
    } catch (error) {
      console.error('获取设备数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedLocation, statusFilter, keyword, page, pageSize, setEquipments, setTotal, setStatistics, setLoading])

  // 监听筛选状态变化
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const tabItems = [
    {
      key: 'category',
      label: '分类',
      children: <CategoryTree categories={categories} />,
    },
    {
      key: 'location',
      label: '位置',
      children: <LocationTree locations={locations} />,
    },
  ]

  const currentStats = statistics ?? initialStatistics

  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <App>
        {/* 标题行 */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 22, fontWeight: 600, color: '#1a1a1a',
              margin: 0, marginBottom: 4, lineHeight: 1.3,
            }}
          >
            设备台账
          </h2>
          <p style={{ fontSize: 14, color: '#787671', margin: 0, lineHeight: 1.5 }}>
            分类管理 · 位置管理 · 设备档案 · 状态追踪
          </p>
        </div>

        <div className="flex gap-4">
          {/* 左侧：可折叠分类/位置树 */}
          {!sidebarCollapsed && (
            <div
              className="shrink-0"
              style={{
                width: SIDEBAR_WIDTH,
                background: '#ffffff',
                padding: 16,
                borderRadius: 12,
                border: '1px solid #e5e3df',
              }}
            >
              <Tabs items={tabItems} />
            </div>
          )}

          {/* 右侧：设备列表 */}
          <div
            className="flex-1 min-w-0"
            style={{
              background: '#ffffff',
              padding: '16px 20px',
              borderRadius: 12,
              border: '1px solid #e5e3df',
              overflow: 'hidden',
            }}
          >
            {/* 折叠按钮 + 统计 + 标题 */}
            <div className="mb-3 flex items-center gap-3">
              <Button
                type="text"
                icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{ color: '#5d5b54', flexShrink: 0 }}
              />
              <StatsCards statistics={currentStats} compact />
            </div>

            {/* 表格区域 */}
            <div style={{ overflowX: 'auto' }}>
              <Spin spinning={loading}>
                <EquipmentTable onRefresh={fetchData} />
              </Spin>
            </div>
          </div>
        </div>

        {/* 抽屉组件 */}
        <EquipmentDrawer onRefresh={fetchData} />
        <CategoryDrawer />
        <LocationDrawer />
        <RepairDrawer
          equipments={initialEquipments.map(e => ({
            id: e.id, equipment_no: e.equipment_no, name: e.name, importance: e.importance,
          }))}
          onRefresh={fetchData}
        />
      </App>
    </ConfigProvider>
  )
}
