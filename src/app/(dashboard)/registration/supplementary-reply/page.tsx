import { fetchSupplementaryReplies } from '@/lib/api/registration'
import SupplementaryReplyClient from '@/components/registration/SupplementaryReplyClient'

export default async function SupplementaryReplyPage() {
  const repliesRes = await fetchSupplementaryReplies({ page: 1, page_size: 20 })

  return (
    <SupplementaryReplyClient
      initialReplies={repliesRes.data}
      initialTotal={repliesRes.meta?.total || 0}
    />
  )
}
