import { cookies } from 'next/headers'

export async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')
  return token?.value
}
