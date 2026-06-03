import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  EquipmentCategory,
  Location,
  Equipment,
  EquipmentStatus,
  EquipmentStatistics,
} from '@/types/equipment'

interface EquipmentStore {
  // 数据
  categories: EquipmentCategory[]
  locations: Location[]
  equipments: Equipment[]
  statistics: EquipmentStatistics | null

  // 筛选状态
  selectedCategory: string | null
  selectedLocation: string | null
  statusFilter: EquipmentStatus | ''
  keyword: string
  page: number
  pageSize: number
  total: number
  loading: boolean

  // 抽屉状态
  equipmentDrawerOpen: boolean
  categoryDrawerOpen: boolean
  locationDrawerOpen: boolean
  editingEquipment: Equipment | null
  editingCategory: EquipmentCategory | null
  editingLocation: Location | null

  // 操作
  setCategories: (categories: EquipmentCategory[]) => void
  setLocations: (locations: Location[]) => void
  setEquipments: (equipments: Equipment[]) => void
  setStatistics: (statistics: EquipmentStatistics | null) => void
  setSelectedCategory: (id: string | null) => void
  setSelectedLocation: (id: string | null) => void
  setStatusFilter: (status: EquipmentStatus | '') => void
  setKeyword: (keyword: string) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setTotal: (total: number) => void
  setLoading: (loading: boolean) => void
  resetFilters: () => void
  openEquipmentDrawer: (equipment?: Equipment) => void
  closeEquipmentDrawer: () => void
  openCategoryDrawer: (category?: EquipmentCategory) => void
  closeCategoryDrawer: () => void
  openLocationDrawer: (location?: Location) => void
  closeLocationDrawer: () => void
}

export const useEquipmentStore = create<EquipmentStore>()(
  devtools(
    (set) => ({
      // 初始状态
      categories: [],
      locations: [],
      equipments: [],
      statistics: null,
      selectedCategory: null,
      selectedLocation: null,
      statusFilter: '',
      keyword: '',
      page: 1,
      pageSize: 20,
      total: 0,
      loading: false,
      equipmentDrawerOpen: false,
      categoryDrawerOpen: false,
      locationDrawerOpen: false,
      editingEquipment: null,
      editingCategory: null,
      editingLocation: null,

      // 操作
      setCategories: (categories) => set({ categories }, false, 'equipment/setCategories'),
      setLocations: (locations) => set({ locations }, false, 'equipment/setLocations'),
      setEquipments: (equipments) => set({ equipments }, false, 'equipment/setEquipments'),
      setStatistics: (statistics) => set({ statistics }, false, 'equipment/setStatistics'),
      setSelectedCategory: (id) => set({ selectedCategory: id, page: 1 }, false, 'equipment/setSelectedCategory'),
      setSelectedLocation: (id) => set({ selectedLocation: id, page: 1 }, false, 'equipment/setSelectedLocation'),
      setStatusFilter: (status) => set({ statusFilter: status, page: 1 }, false, 'equipment/setStatusFilter'),
      setKeyword: (keyword) => set({ keyword, page: 1 }, false, 'equipment/setKeyword'),
      setPage: (page) => set({ page }, false, 'equipment/setPage'),
      setPageSize: (pageSize) => set({ pageSize, page: 1 }, false, 'equipment/setPageSize'),
      setTotal: (total) => set({ total }, false, 'equipment/setTotal'),
      setLoading: (loading) => set({ loading }, false, 'equipment/setLoading'),
      resetFilters: () => set({
        selectedCategory: null,
        selectedLocation: null,
        statusFilter: '',
        keyword: '',
        page: 1,
        pageSize: 20,
      }, false, 'equipment/resetFilters'),
      openEquipmentDrawer: (equipment) =>
        set({
          equipmentDrawerOpen: true,
          editingEquipment: equipment || null,
        }, false, 'equipment/openEquipmentDrawer'),
      closeEquipmentDrawer: () =>
        set({
          equipmentDrawerOpen: false,
          editingEquipment: null,
        }, false, 'equipment/closeEquipmentDrawer'),
      openCategoryDrawer: (category) =>
        set({
          categoryDrawerOpen: true,
          editingCategory: category || null,
        }, false, 'equipment/openCategoryDrawer'),
      closeCategoryDrawer: () =>
        set({
          categoryDrawerOpen: false,
          editingCategory: null,
        }, false, 'equipment/closeCategoryDrawer'),
      openLocationDrawer: (location) =>
        set({
          locationDrawerOpen: true,
          editingLocation: location || null,
        }, false, 'equipment/openLocationDrawer'),
      closeLocationDrawer: () =>
        set({
          locationDrawerOpen: false,
          editingLocation: null,
        }, false, 'equipment/closeLocationDrawer'),
    }),
    { name: 'equipment-store' },
  ),
)
