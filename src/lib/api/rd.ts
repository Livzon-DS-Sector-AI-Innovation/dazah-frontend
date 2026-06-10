// 贝叶斯优化 API 调用
import { 
  BayesianProject, 
  BayesianExperiment, 
  ReactionScope,
  CreateProjectRequest,
  SuggestExperimentsRequest,
  BayesianComponent,
  BayesianObjective
} from '@/types/rd'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
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
export async function fetchProjects(): Promise<BayesianProject[]> {
  return fetchAPI('/research/projects')
}

export async function fetchProject(projectId: string): Promise<BayesianProject> {
  return fetchAPI(`/research/projects/${projectId}`)
}

export async function createProject(data: CreateProjectRequest): Promise<BayesianProject> {
  return fetchAPI('/research/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteProject(projectId: string): Promise<void> {
  return fetchAPI(`/research/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export async function updateProject(projectId: string, data: { name?: string; description?: string; status?: string }): Promise<BayesianProject> {
  return fetchAPI(`/research/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}


// 组件管理
export async function fetchComponents(projectId: string): Promise<BayesianComponent[]> {
  return fetchAPI(`/research/projects/${projectId}/components`)
}

export async function addComponent(projectId: string, data: Omit<BayesianComponent, 'id' | 'project_id' | 'created_at'>): Promise<BayesianComponent> {
  return fetchAPI(`/research/projects/${projectId}/components`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteComponent(componentId: string): Promise<void> {
  return fetchAPI(`/research/components/${componentId}`, {
    method: 'DELETE',
  })
}


// 目标管理
export async function fetchObjectives(projectId: string): Promise<BayesianObjective[]> {
  return fetchAPI(`/research/projects/${projectId}/objectives`)
}

export async function addObjective(projectId: string, data: Omit<BayesianObjective, 'id' | 'project_id' | 'created_at'>): Promise<BayesianObjective> {
  return fetchAPI(`/research/projects/${projectId}/objectives`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteObjective(objectiveId: string): Promise<void> {
  return fetchAPI(`/research/objectives/${objectiveId}`, {
    method: 'DELETE',
  })
}


// 实验管理
export async function fetchExperiments(projectId: string): Promise<BayesianExperiment[]> {
  return fetchAPI(`/research/projects/${projectId}/experiments`)
}

export async function suggestExperiments(data: SuggestExperimentsRequest): Promise<BayesianExperiment[]> {
  return fetchAPI('/research/experiments/suggest', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function recordExperimentResult(experimentId: string, data: Record<string, number>): Promise<BayesianExperiment> {
  return fetchAPI(`/research/experiments/${experimentId}/result`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}


// 反应范围
export async function fetchReactionScopes(projectId: string): Promise<ReactionScope[]> {
  return fetchAPI(`/research/projects/${projectId}/reaction-scopes`)
}

export async function generateReactionScope(projectId: string, name: string): Promise<ReactionScope> {
  return fetchAPI(`/research/projects/${projectId}/reaction-scopes`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

// CSV 导入导出
export async function importCSV(projectId: string, file: File): Promise<{ success: boolean; message: string; rows_imported: number }> {
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await fetch(`${API_BASE}/api/v1/research/projects/${projectId}/import-csv`, {
    method: 'POST',
    body: formData,
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '导入失败' }))
    throw new Error(error.message || error.detail || '导入失败')
  }
  
  const data = await res.json()
  return data.data
}

export async function exportCSV(projectId: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/v1/research/projects/${projectId}/export-csv`)
  
  if (!res.ok) {
    throw new Error('导出失败')
  }
  
  return res.blob()
}
