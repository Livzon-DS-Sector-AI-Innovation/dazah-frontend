'use server'

import { revalidatePath } from 'next/cache'
import { ResearchProjectCreate, ResearchProjectUpdate } from '@/types/rd'

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

export async function createResearchProject(data: ResearchProjectCreate) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/research/projects`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/rd')
  return result
}

export async function updateResearchProject(projectId: string, data: ResearchProjectUpdate) {
  const result = await actionFetch(`${API_BASE_URL}/api/v1/research/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath('/rd')
  return result
}

export async function deleteResearchProject(projectId: string) {
  await actionFetch(`${API_BASE_URL}/api/v1/research/projects/${projectId}`, {
    method: 'DELETE',
  })
  revalidatePath('/rd')
}
