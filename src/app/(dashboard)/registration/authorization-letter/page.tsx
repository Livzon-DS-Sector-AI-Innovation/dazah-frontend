import { fetchAuthorizationLetters, fetchProducts } from '@/lib/api/registration'
import AuthorizationLetterClient from '@/components/registration/AuthorizationLetterClient'

export default async function AuthorizationLetterPage() {
  const [lettersRes, productsRes] = await Promise.all([
    fetchAuthorizationLetters({ page: 1, page_size: 20 }),
    fetchProducts(),
  ])

  return (
    <AuthorizationLetterClient
      initialLetters={lettersRes.data}
      initialTotal={lettersRes.meta?.total || 0}
      products={productsRes.data}
    />
  )
}
