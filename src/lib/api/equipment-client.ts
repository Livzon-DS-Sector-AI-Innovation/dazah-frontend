'use client'

import { EquipmentListResponse, EquipmentStatistics } from '@/types/equipment'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface FetchEquipmentsParams {
  category_id?: string | null
  location_id?: string | null
  status?: string
  keyword?: string
  page?: number
  page_size?: number
}

export async function fetchEquipmentsClient(params: FetchEquipmentsParams = {}): Promise<EquipmentListResponse> {
  const searchParams = new URLSearchParams()

  if (params.category_id) searchParams.append('category_id', params.category_id)
  if (params.location_id) searchParams.append('location_id', params.location_id)
  if (params.status) searchParams.append('status', params.status)
  if (params.keyword) searchParams.append('keyword', params.keyword)
  if (params.page && params.page > 0) searchParams.append('page', params.page.toString())
  if (params.page_size && params.page_size > 0) searchParams.append('page_size', params.page_size.toString())

  const queryString = searchParams.toString()
  const url = queryString
    ? `${API_BASE_URL}/api/v1/equipment/equipments?${queryString}`
    : `${API_BASE_URL}/api/v1/equipment/equipments`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  return {
    items: result.data || [],
    total: result.meta?.total || 0,
    page: result.meta?.page || 1,
    page_size: result.meta?.page_size || 20,
  }
}

export async function fetchEquipmentStatisticsClient(): Promise<EquipmentStatistics> {
  const response = await fetch(`${API_BASE_URL}/api/v1/equipment/equipments/statistics`)
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  return result.data || { total: 0, by_status: {}, by_category: {}, by_location: {} }
}
