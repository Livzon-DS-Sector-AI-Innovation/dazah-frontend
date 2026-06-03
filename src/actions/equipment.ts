'use server'

import { revalidatePath } from 'next/cache'
import { CreateCategoryInput, UpdateCategoryInput, CreateLocationInput, UpdateLocationInput, CreateEquipmentInput, UpdateEquipmentInput } from '@/types/equipment'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

async function actionFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
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
  const text = await response.text()
  if (!text) return null
  const json = JSON.parse(text)
  return json.data ?? json
}

// 设备分类
export async function createCategory(data: CreateCategoryInput) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/equipment/categories`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/equipment')
  return result
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/equipment/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath('/equipment')
  return result
}

export async function deleteCategory(id: string) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/equipment/categories/${id}`, {
    method: 'DELETE',
  })
  revalidatePath('/equipment')
  return result
}

// 位置管理
export async function createLocation(data: CreateLocationInput) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/equipment/locations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/equipment')
  return result
}

export async function updateLocation(id: string, data: UpdateLocationInput) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/equipment/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath('/equipment')
  return result
}

export async function deleteLocation(id: string) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/equipment/locations/${id}`, {
    method: 'DELETE',
  })
  revalidatePath('/equipment')
  return result
}

// 设备管理
export async function createEquipment(data: CreateEquipmentInput) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/equipment/equipments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/equipment')
  return result
}

export async function updateEquipment(id: string, data: UpdateEquipmentInput) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/equipment/equipments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath('/equipment')
  return result
}

export async function deleteEquipment(id: string) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/equipment/equipments/${id}`, {
    method: 'DELETE',
  })
  revalidatePath('/equipment')
  return result
}
