'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// ====== 类型定义 ======
export interface SummaryStats {
  totalCount: number
  todayNewCount: number
  unreadNewCount: number
  lastSyncTime: string | null
  lastSyncStatus: string | null
}

export interface RegulatoryDocument {
  id: string
  sourceId: string
  channelId: string
  documentId: string
  title: string
  publishDate: string | null
  statusText: string | null
  classification: string | null
  originalUrl: string | null
  isNew: boolean
  isRead: boolean
  firstFoundAt: string
  lastCheckedAt: string | null
  createdAt: string
}

export interface SyncJob {
  id: string
  sourceId: string
  channelId: string
  jobType: string
  startedAt: string | null
  finishedAt: string | null
  status: string
  totalPages: number | null
  checkedCount: number
  newCount: number
  updatedCount: number
  errorMessage: string | null
  createdAt: string
}

export interface DocumentListParams {
  keyword?: string
  publishDateFrom?: string
  publishDateTo?: string
  statusText?: string
  classification?: string
  isNew?: boolean
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// ====== API 调用 ======
export async function fetchSummary(): Promise<SummaryStats> {
  const res = await fetch(`${API_BASE_URL}/api/v1/regulatory-tracker/summary`)
  const json: ApiResponse<SummaryStats> = await res.json()
  return json.data
}

export async function fetchDocuments(
  params: DocumentListParams = {}
): Promise<PaginatedResponse<RegulatoryDocument>> {
  const searchParams = new URLSearchParams()
  
  if (params.keyword) searchParams.append('keyword', params.keyword)
  if (params.publishDateFrom) searchParams.append('publishDateFrom', params.publishDateFrom)
  if (params.publishDateTo) searchParams.append('publishDateTo', params.publishDateTo)
  if (params.statusText) searchParams.append('statusText', params.statusText)
  if (params.classification) searchParams.append('classification', params.classification)
  if (params.isNew !== undefined) searchParams.append('isNew', params.isNew.toString())
  if (params.page) searchParams.append('page', params.page.toString())
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString())

  const url = `${API_BASE_URL}/api/v1/regulatory-documents?${searchParams.toString()}`
  const res = await fetch(url)
  const json: ApiResponse<PaginatedResponse<RegulatoryDocument>> = await res.json()
  return json.data
}

export async function markDocumentRead(id: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/v1/regulatory-documents/${id}/read`, {
    method: 'PATCH',
  })
}

export async function fetchSyncJobs(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<SyncJob>> {
  const url = `${API_BASE_URL}/api/v1/sync-jobs?page=${page}&pageSize=${pageSize}`
  const res = await fetch(url)
  const json: ApiResponse<PaginatedResponse<SyncJob>> = await res.json()
  return json.data
}
