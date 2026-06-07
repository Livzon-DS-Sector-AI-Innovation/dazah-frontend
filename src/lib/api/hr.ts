import {
  EmployeeListResponse,
  EmployeeResponse,
  EmployeeCreateInput,
  EmployeeUpdateInput,
  DepartmentListResponse,
  DepartmentCreateInput,
  DepartmentUpdateInput,
  TeamListResponse,
  TeamCreateInput,
  TeamUpdateInput,
  OffboardingRecordListResponse,
  OffboardingRecordCreateInput,
  OffboardingRecordUpdateInput,
  SyncStatusResponse,
} from '@/types/hr'

const API_BASE = 'http://localhost:8000'

export async function fetchEmployees(
  params?: {
    department?: string
    status?: string
    keyword?: string
    page?: number
    page_size?: number
  }
): Promise<EmployeeListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.department) searchParams.set('department', params.department)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.keyword) searchParams.set('keyword', params.keyword)
  searchParams.set('page', String(params?.page || 1))
  searchParams.set('page_size', String(params?.page_size || 20))

  const res = await fetch(`${API_BASE}/api/v1/hr/employees?${searchParams.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取员工列表失败')
  return res.json()
}

export async function fetchEmployeeById(id: string): Promise<EmployeeResponse> {
  const res = await fetch(`${API_BASE}/api/v1/hr/employees/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取员工详情失败')
  return res.json()
}

export async function fetchDepartments(
  params?: {
    keyword?: string
    page?: number
    page_size?: number
  }
): Promise<DepartmentListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.keyword) searchParams.set('keyword', params.keyword)
  searchParams.set('page', String(params?.page || 1))
  searchParams.set('page_size', String(params?.page_size || 100))

  const res = await fetch(`${API_BASE}/api/v1/hr/departments?${searchParams.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取部门列表失败')
  return res.json()
}

export async function fetchTeams(
  params?: {
    department_id?: string
    keyword?: string
    page?: number
    page_size?: number
  }
): Promise<TeamListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.department_id) searchParams.set('department_id', params.department_id)
  if (params?.keyword) searchParams.set('keyword', params.keyword)
  searchParams.set('page', String(params?.page || 1))
  searchParams.set('page_size', String(params?.page_size || 100))

  const res = await fetch(`${API_BASE}/api/v1/hr/teams?${searchParams.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取班组列表失败')
  return res.json()
}

export async function fetchOffboardingRecords(
  params?: {
    employee_id?: string
    keyword?: string
    page?: number
    page_size?: number
  }
): Promise<OffboardingRecordListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.employee_id) searchParams.set('employee_id', params.employee_id)
  if (params?.keyword) searchParams.set('keyword', params.keyword)
  searchParams.set('page', String(params?.page || 1))
  searchParams.set('page_size', String(params?.page_size || 20))

  const res = await fetch(`${API_BASE}/api/v1/hr/offboarding-records?${searchParams.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取离职记录失败')
  return res.json()
}

// ─── Feishu Sync APIs ───

export async function fetchSyncStatus(): Promise<SyncStatusResponse> {
  const res = await fetch(`${API_BASE}/api/v1/hr/employees/sync-status`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取同步状态失败')
  return res.json()
}

export async function syncFromFeishu(): Promise<{ code: number; message: string; data: { created: number; updated: number; failed: number; total: number } }> {
  const res = await fetch(`${API_BASE}/api/v1/hr/employees/sync-from-feishu`, {
    method: 'POST',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('从飞书同步失败')
  return res.json()
}

export async function syncToFeishu(id: string): Promise<{ code: number; message: string; data: { feishu_record_id: string } }> {
  const res = await fetch(`${API_BASE}/api/v1/hr/employees/${id}/sync-to-feishu`, {
    method: 'POST',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('同步到飞书失败')
  return res.json()
}
