'use server'

import { revalidatePath } from 'next/cache'
import { getServerToken } from '@/lib/auth'
import {
  CreateInspectionRouteInput, UpdateInspectionRouteInput, RouteEquipmentItem,
  CreateInspectionTaskInput, EquipmentCheckResult,
  InspectionRecordItem,
} from '@/types/inspection'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'
const BASE = `${API_BASE_URL}/api/v1/equipment/inspection`

async function actionFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getServerToken()}`,
      ...options?.headers,
    },
  })
  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    let errorMessage = `请求失败: ${response.status} ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorBody)
      if (errorJson.message) errorMessage = errorJson.message
    } catch { /* ignore */ }
    throw new Error(errorMessage)
  }
  const text = await response.text()
  if (!text) return null
  const json = JSON.parse(text)
  return json.data ?? json
}

function revalidate() {
  revalidatePath('/equipment/inspection')
}

// ==================== 巡检路线 ====================
export async function createInspectionRoute(data: CreateInspectionRouteInput) {
  const result = await actionFetch(`${BASE}/routes`, { method: 'POST', body: JSON.stringify(data) })
  revalidate()
  return result
}

export async function updateInspectionRoute(id: string, data: UpdateInspectionRouteInput) {
  const result = await actionFetch(`${BASE}/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  revalidate()
  return result
}

export async function deleteInspectionRoute(id: string) {
  const result = await actionFetch(`${BASE}/routes/${id}`, { method: 'DELETE' })
  revalidate()
  return result
}

export async function setRouteEquipments(routeId: string, equipments: RouteEquipmentItem[]) {
  const result = await actionFetch(`${BASE}/routes/${routeId}/equipments`, {
    method: 'POST',
    body: JSON.stringify({ equipments }),
  })
  revalidate()
  return result
}

// ==================== 巡检任务 ====================
export async function createInspectionTask(data: CreateInspectionTaskInput) {
  const result = await actionFetch(`${BASE}/tasks`, { method: 'POST', body: JSON.stringify(data) })
  revalidate()
  return result
}

export async function startInspectionTask(id: string) {
  const result = await actionFetch(`${BASE}/tasks/${id}/start`, { method: 'PUT' })
  revalidate()
  return result
}

export async function completeInspectionTask(id: string) {
  const result = await actionFetch(`${BASE}/tasks/${id}/complete`, { method: 'PUT' })
  revalidate()
  return result
}

export async function closeInspectionTask(id: string, closureRemark?: string) {
  const result = await actionFetch(`${BASE}/tasks/${id}/close`, {
    method: 'PUT',
    body: JSON.stringify({ closure_remark: closureRemark }),
  })
  revalidate()
  return result
}

// ==================== 巡检执行 ====================
export async function submitEquipmentCheck(taskId: string, equipmentId: string, data: EquipmentCheckResult) {
  const result = await actionFetch(`${BASE}/tasks/${taskId}/equipments/${equipmentId}/check`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidate()
  return result
}

// ==================== 照片 ====================
export async function uploadInspectionPhoto(taskId: string, equipmentId: string, formData: FormData) {
  const token = await getServerToken()
  const response = await fetch(`${BASE}/tasks/${taskId}/equipments/${equipmentId}/photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as Record<string, unknown>).message as string || '上传失败')
  }
  revalidate()
  const json = await response.json()
  return json.data
}

export async function deleteInspectionPhoto(taskId: string, photoId: string) {
  const result = await actionFetch(`${BASE}/tasks/${taskId}/photos/${photoId}`, { method: 'DELETE' })
  revalidate()
  return result
}
