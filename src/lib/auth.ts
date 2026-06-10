import { cookies } from 'next/headers'

export async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')
  return token?.value
}

/** 返回带 Authorization 的 headers 对象，供 Server Actions 调用后端 API */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = await getServerToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}
