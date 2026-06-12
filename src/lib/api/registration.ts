import {
  ProductListResponse,
  AuthorizationLetterListResponse,
  AuthorizationLetterResponse,
  AuthorizationLetterListParams,
  SupplementaryReplyListResponse,
  SupplementaryReplyResponse,
  SupplementaryReplyListParams,
} from '@/types/registration'

const API_BASE = 'http://localhost:8000'

export async function fetchProducts(): Promise<ProductListResponse> {
  const res = await fetch(`${API_BASE}/api/v1/registration/authorization-letters/products`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取品种对照表失败')
  return res.json()
}

export async function fetchAuthorizationLetters(
  params?: AuthorizationLetterListParams
): Promise<AuthorizationLetterListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.product_name) searchParams.set('product_name', params.product_name)
  if (params?.preparation_unit) searchParams.set('preparation_unit', params.preparation_unit)
  searchParams.set('page', String(params?.page || 1))
  searchParams.set('page_size', String(params?.page_size || 20))

  const res = await fetch(`${API_BASE}/api/v1/registration/authorization-letters?${searchParams.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取授权书列表失败')
  return res.json()
}

export async function fetchAuthorizationLetterById(id: string): Promise<AuthorizationLetterResponse> {
  const res = await fetch(`${API_BASE}/api/v1/registration/authorization-letters/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取授权书详情失败')
  return res.json()
}

export async function deleteAuthorizationLetter(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/registration/authorization-letters/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('删除授权书记录失败')
}

export function getAuthorizationLetterDownloadUrl(id: string): string {
  return `${API_BASE}/api/v1/registration/authorization-letters/${id}/download`
}

// ── 发补回复 API ──

export async function fetchSupplementaryReplies(
  params?: SupplementaryReplyListParams
): Promise<SupplementaryReplyListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.drug_name) searchParams.set('drug_name', params.drug_name)
  searchParams.set('page', String(params?.page || 1))
  searchParams.set('page_size', String(params?.page_size || 20))

  const res = await fetch(`${API_BASE}/api/v1/registration/supplementary-replies?${searchParams.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取发补回复列表失败')
  return res.json()
}

export async function fetchSupplementaryReplyById(id: string): Promise<SupplementaryReplyResponse> {
  const res = await fetch(`${API_BASE}/api/v1/registration/supplementary-replies/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('获取发补回复详情失败')
  return res.json()
}

export async function deleteSupplementaryReply(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/registration/supplementary-replies/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('删除发补回复记录失败')
}

export function getSupplementaryReplyDownloadUrl(id: string): string {
  return `${API_BASE}/api/v1/registration/supplementary-replies/${id}/download`
}
