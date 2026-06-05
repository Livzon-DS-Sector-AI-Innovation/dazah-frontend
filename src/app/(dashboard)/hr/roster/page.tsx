import { fetchEmployees } from '@/lib/api/hr'
import RosterClient from '@/components/hr/RosterClient'

export default async function RosterPage() {
  const res = await fetchEmployees({ page: 1, page_size: 20 })

  return (
    <RosterClient
      initialEmployees={res.data}
      initialTotal={res.meta?.total || 0}
    />
  )
}
