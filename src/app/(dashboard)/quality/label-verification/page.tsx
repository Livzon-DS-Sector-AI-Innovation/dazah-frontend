import { fetchLabelVerifications } from '@/lib/api/label-verification'
import LabelVerificationClient from '@/components/quality/LabelVerificationClient'

export default async function LabelVerificationPage() {
  const res = await fetchLabelVerifications({ page: 1, page_size: 20 })

  return (
    <LabelVerificationClient
      initialVerifications={res.data}
      initialTotal={res.meta?.total || 0}
    />
  )
}
