'use server'

import { revalidatePath } from 'next/cache'
import {
  CreateDeviationRequest,
  UpdateDeviationRequest,
  CreateCapaRequest,
  UpdateCapaRequest,
  CreateDepartmentContactRequest,
  UpdateDepartmentContactRequest,
} from '@/types/quality'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

async function actionFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    let errorMessage = `请求失败: ${response.status} ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorBody)
      if (errorJson.message) errorMessage = errorJson.message
    } catch {}
    throw new Error(errorMessage)
  }
  if (response.status === 204) return null
  const result = await response.json()
  return result.data
}

// ============ Deviation Actions ============
export async function createDeviation(data: CreateDeviationRequest) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/quality/deviations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/quality')
  revalidatePath('/quality/deviations')
  return result
}

export async function updateDeviation(deviationId: string, data: UpdateDeviationRequest) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/quality/deviations/${deviationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath('/quality')
  revalidatePath('/quality/deviations')
  revalidatePath(`/quality/deviations/${deviationId}`)
  return result
}

export async function deleteDeviation(deviationId: string) {
  await actionFetch(`${API_BASE_URL}/api/v1/quality/deviations/${deviationId}`, {
    method: 'DELETE',
  })
  revalidatePath('/quality')
  revalidatePath('/quality/deviations')
}

// ============ CAPA Actions ============
export async function createCapa(data: CreateCapaRequest) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/quality/capas`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/quality')
  revalidatePath('/quality/capas')
  return result
}

export async function updateCapa(capaId: string, data: UpdateCapaRequest) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/quality/capas/${capaId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath('/quality')
  revalidatePath('/quality/capas')
  revalidatePath(`/quality/capas/${capaId}`)
  return result
}

export async function deleteCapa(capaId: string) {
  await actionFetch(`${API_BASE_URL}/api/v1/quality/capas/${capaId}`, {
    method: 'DELETE',
  })
  revalidatePath('/quality')
  revalidatePath('/quality/capas')
}

// ============ Department Contact Actions ============
export async function createDepartmentContact(data: CreateDepartmentContactRequest) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/quality/department-contacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/quality')
  revalidatePath('/quality/department-contacts')
  return result
}

export async function updateDepartmentContact(contactId: string, data: UpdateDepartmentContactRequest) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/quality/department-contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath('/quality')
  revalidatePath('/quality/department-contacts')
  return result
}

export async function deleteDepartmentContact(contactId: string) {
  await actionFetch(`${API_BASE_URL}/api/v1/quality/department-contacts/${contactId}`, {
    method: 'DELETE',
  })
  revalidatePath('/quality')
  revalidatePath('/quality/department-contacts')
}
