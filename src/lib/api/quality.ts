import {
  DeviationFilters,
  DeviationListResponse,
  DeviationDetail,
  CreateDeviationRequest,
  UpdateDeviationRequest,
  CapaFilters,
  CapaListResponse,
  CapaDetail,
  CreateCapaRequest,
  UpdateCapaRequest,
  DepartmentContactListResponse,
  DepartmentContact,
  CreateDepartmentContactRequest,
  UpdateDepartmentContactRequest,
} from '@/types/quality'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  return data.data
}

async function apiFetchPaginated<T>(
  url: string,
  options?: RequestInit
): Promise<{ items: T[]; total: number; page: number; page_size: number }> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
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

// ============ Deviation API ============
export async function fetchDeviations(
  filters: DeviationFilters = {}
): Promise<DeviationListResponse> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.level) params.set('level', filters.level)
  if (filters.department) params.set('department', filters.department)
  if (filters.keyword) params.set('keyword', filters.keyword)
  params.set('page', String(filters.page || 1))
  params.set('page_size', String(filters.page_size || 20))
  return apiFetchPaginated(
    `${API_BASE_URL}/api/v1/quality/deviations?${params.toString()}`
  )
}

export async function fetchDeviation(
  deviationId: string
): Promise<DeviationDetail> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/deviations/${deviationId}`)
}

export async function createDeviation(
  data: CreateDeviationRequest
): Promise<DeviationDetail> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/deviations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateDeviation(
  deviationId: string,
  data: UpdateDeviationRequest
): Promise<DeviationDetail> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/deviations/${deviationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteDeviation(
  deviationId: string
): Promise<void> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/deviations/${deviationId}`, {
    method: 'DELETE',
  })
}

// ============ CAPA API ============
export async function fetchCapas(
  filters: CapaFilters = {}
): Promise<CapaListResponse> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.source) params.set('source', filters.source)
  if (filters.category) params.set('category', filters.category)
  if (filters.keyword) params.set('keyword', filters.keyword)
  params.set('page', String(filters.page || 1))
  params.set('page_size', String(filters.page_size || 20))
  return apiFetchPaginated(
    `${API_BASE_URL}/api/v1/quality/capas?${params.toString()}`
  )
}

export async function fetchCapa(
  capaId: string
): Promise<CapaDetail> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/capas/${capaId}`)
}

export async function createCapa(
  data: CreateCapaRequest
): Promise<CapaDetail> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/capas`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCapa(
  capaId: string,
  data: UpdateCapaRequest
): Promise<CapaDetail> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/capas/${capaId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCapa(
  capaId: string
): Promise<void> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/capas/${capaId}`, {
    method: 'DELETE',
  })
}

// ============ Department Contact API ============
export async function fetchDepartmentContacts(
  page: number = 1,
  page_size: number = 20
): Promise<DepartmentContactListResponse> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('page_size', String(page_size))
  return apiFetchPaginated(
    `${API_BASE_URL}/api/v1/quality/department-contacts?${params.toString()}`
  )
}

export async function fetchDepartmentContact(
  contactId: string
): Promise<DepartmentContact> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/department-contacts/${contactId}`)
}

export async function createDepartmentContact(
  data: CreateDepartmentContactRequest
): Promise<DepartmentContact> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/department-contacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateDepartmentContact(
  contactId: string,
  data: UpdateDepartmentContactRequest
): Promise<DepartmentContact> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/department-contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteDepartmentContact(
  contactId: string
): Promise<void> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/department-contacts/${contactId}`, {
    method: 'DELETE',
  })
}

// ============ Deviation Workflow API ============
export async function submitInvestigation(
  deviationId: string,
  data: {
    description?: string
    investigation_records?: any[]
    nonconformity_description?: string
    root_cause_analysis?: string
    risk_assessment?: string
    urgent_measures?: string
    capa_proposals?: any[]
  }
): Promise<{ success: boolean }> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/deviations/${deviationId}/submit-investigation`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function submitReview(
  deviationId: string,
  data: {
    step: string
    result: string
    content: string
    reason_category?: string
    deviation_level?: string
  }
): Promise<{ success: boolean }> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/deviations/${deviationId}/submit-review`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function submitFinalCode(
  deviationId: string,
  finalCode: string
): Promise<{ success: boolean }> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/deviations/${deviationId}/submit-final-code?final_code=${encodeURIComponent(finalCode)}`, {
    method: 'POST',
  })
}

export async function resubmitDeviation(
  deviationId: string
): Promise<{ success: boolean }> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/deviations/${deviationId}/resubmit`, {
    method: 'POST',
  })
}

// ============ Statistics API ============
export async function fetchDeviationStatistics(): Promise<{
  total: number
  pending: number
  departmentDistribution: Array<{ name: string; count: number }>
  statusDistribution: Array<{ status: string; count: number }>
  stepBreakdown: Array<{
    step: string
    label: string
    roleLabel: string
    count: number
  }>
}> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/statistics/deviations`)
}

export async function fetchCapaStatistics(): Promise<{
  total: number
  statusDistribution: Array<{ status: string; count: number }>
  sourceDistribution: Array<{ source: string; count: number }>
}> {
  return apiFetch(`${API_BASE_URL}/api/v1/quality/statistics/capas`)
}
