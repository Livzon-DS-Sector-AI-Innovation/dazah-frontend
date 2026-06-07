import { getAIWorkflowConfigs, getAPICallConfigs } from '@/actions/safety'
import AIWorkflowConfigClient from '@/components/safety/AIWorkflowConfigClient'

export const dynamic = 'force-dynamic'

export default async function AIWorkflowConfigPage() {
  let workflows: Awaited<ReturnType<typeof getAIWorkflowConfigs>>['data'] = []
  let apiConnected = false
  let apiModelLabel: string | undefined

  try {
    const [wfRes, apiRes] = await Promise.all([
      getAIWorkflowConfigs({ page_size: 500 }),
      getAPICallConfigs(true),
    ])

    workflows = wfRes.data || []

    // Check if there's an active API config
    const activeConfig = (apiRes.data || []).find((c) => c.is_active)
    if (activeConfig) {
      apiConnected = true
      apiModelLabel = activeConfig.model_name
    }
  } catch {
    // Use empty defaults
  }

  return (
    <AIWorkflowConfigClient
      initialWorkflows={workflows || []}
      apiConnected={apiConnected}
      apiModelLabel={apiModelLabel}
    />
  )
}
