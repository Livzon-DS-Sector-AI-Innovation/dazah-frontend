'use server'

import { 
  CreateProjectRequest,
  SuggestExperimentsRequest,
  BayesianComponent,
  BayesianObjective
} from '@/types/rd'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000/api/v1'

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '请求失败' }))
    throw new Error(error.message || error.detail || '请求失败')
  }
  
  const data = await res.json()
  return data.data
}

// 项目管理
export async function createProject(data: CreateProjectRequest) {
  return apiCall('/research/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteProject(projectId: string) {
  return apiCall(`/research/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export async function updateProject(projectId: string, data: { name?: string; description?: string; status?: string }) {
  return apiCall(`/research/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}


// 组件管理
export async function addComponent(projectId: string, data: Omit<BayesianComponent, 'id' | 'project_id' | 'created_at'>) {
  return apiCall(`/research/projects/${projectId}/components`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteComponent(componentId: string) {
  return apiCall(`/research/components/${componentId}`, {
    method: 'DELETE',
  })
}


// 目标管理
export async function addObjective(projectId: string, data: Omit<BayesianObjective, 'id' | 'project_id' | 'created_at'>) {
  return apiCall(`/research/projects/${projectId}/objectives`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteObjective(objectiveId: string) {
  return apiCall(`/research/objectives/${objectiveId}`, {
    method: 'DELETE',
  })
}


// 实验推荐
export async function suggestExperiments(data: SuggestExperimentsRequest) {
  return apiCall('/research/experiments/suggest', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function recordExperimentResult(experimentId: string, data: Record<string, number>) {
  return apiCall(`/research/experiments/${experimentId}/result`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}


// 反应范围生成
export async function generateReactionScope(projectId: string, name: string) {
  return apiCall(`/research/projects/${projectId}/reaction-scopes`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}
