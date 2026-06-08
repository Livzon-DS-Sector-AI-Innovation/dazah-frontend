import { getAPICallConfigs } from '@/actions/safety'
import APICallConfigClient from '@/components/safety/APICallConfigClient'

export const dynamic = 'force-dynamic'

export default async function APICallConfigPage() {
  let configs: Awaited<ReturnType<typeof getAPICallConfigs>>['data'] = []

  try {
    const res = await getAPICallConfigs()
    configs = res.data || []
  } catch {
    // Use empty defaults
  }

  return <APICallConfigClient initialConfigs={configs || []} />
}
