import { EquipmentPage } from '@/components/equipment'
import { fetchCategoryTree, fetchLocationTree, fetchEquipments, fetchEquipmentStatistics } from '@/lib/api/equipment'
import { EquipmentCategory, Location, Equipment, EquipmentStatistics } from '@/types/equipment'

// 默认空数据
const defaultStatistics: EquipmentStatistics = {
  total: 0,
  by_status: {
    '在用': 0,
    '备用': 0,
    '维修中': 0,
    '停用': 0,
    '报废': 0,
  },
  by_category: {},
  by_location: {},
}

export default async function EquipmentPageWrapper() {
  let categories: EquipmentCategory[] = []
  let locations: Location[] = []
  let equipments: Equipment[] = []
  let total = 0
  let statistics = defaultStatistics

  try {
    // 获取初始数据
    const result = await Promise.all([
      fetchCategoryTree(),
      fetchLocationTree(),
      fetchEquipments({ page: 1, page_size: 20 }),
      fetchEquipmentStatistics(),
    ])
    categories = result[0]
    locations = result[1]
    equipments = result[2].items
    total = result[2].total
    statistics = result[3]
  } catch (error) {
    // 后端服务不可用时，使用空数据降级
    console.warn('设备模块数据加载失败，使用空数据:', error)
  }

  return (
    <EquipmentPage
      initialCategories={categories}
      initialLocations={locations}
      initialEquipments={equipments}
      initialTotal={total}
      initialStatistics={statistics}
    />
  )
}
