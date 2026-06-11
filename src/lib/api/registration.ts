import {
  ProductListResponse,
  AuthorizationLetterListResponse,
  AuthorizationLetterResponse,
  AuthorizationLetterListParams,
} from '@/types/registration'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000'

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
