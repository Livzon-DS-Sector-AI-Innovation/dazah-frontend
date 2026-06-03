import { EquipmentCategory, Location, EquipmentFilters, EquipmentListResponse, EquipmentStatistics } from '@/types/equipment'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // TODO: 添加认证头
      // Authorization: `Bearer ${await getServerToken()}`,
      ...options?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  return data.data
}

// 处理带分页的响应
async function apiFetchPaginated(url: string, options?: RequestInit): Promise<EquipmentListResponse> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // TODO: 添加认证头
      // Authorization: `Bearer ${await getServerToken()}`,
      ...options?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status} ${response.statusText}`)
  }
  const result = await response.json()
  // 后端返回格式: { code, message, data: [...], meta: { page, page_size, total } }
  return {
    items: result.data || [],
    total: result.meta?.total || 0,
    page: result.meta?.page || 1,
    page_size: result.meta?.page_size || 20,
  }
}

// 设备分类
export async function fetchCategories(): Promise<EquipmentCategory[]> {
  return apiFetch(`${API_BASE_URL}/api/v1/equipment/categories`)
}

export async function fetchCategoryTree(): Promise<EquipmentCategory[]> {
  return apiFetch(`${API_BASE_URL}/api/v1/equipment/categories?tree=true`)
}

// 位置管理
export async function fetchLocations(): Promise<Location[]> {
  return apiFetch(`${API_BASE_URL}/api/v1/equipment/locations`)
}

export async function fetchLocationTree(): Promise<Location[]> {
  return apiFetch(`${API_BASE_URL}/api/v1/equipment/locations?tree=true`)
}

// 设备管理
export async function fetchEquipments(filters: EquipmentFilters = {}): Promise<EquipmentListResponse> {
  const params = new URLSearchParams()
  if (filters.category_id) params.append('category_id', filters.category_id)
  if (filters.location_id) params.append('location_id', filters.location_id)
  if (filters.status) params.append('status', filters.status)
  if (filters.keyword) params.append('keyword', filters.keyword)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.page_size) params.append('page_size', filters.page_size.toString())

  const queryString = params.toString()
  const url = queryString
    ? `${API_BASE_URL}/api/v1/equipment/equipments?${queryString}`
    : `${API_BASE_URL}/api/v1/equipment/equipments`

  return apiFetchPaginated(url)
}

export async function fetchEquipmentStatistics(): Promise<EquipmentStatistics> {
  return apiFetch(`${API_BASE_URL}/api/v1/equipment/equipments/statistics`)
}
