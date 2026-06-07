import { ResearchPage } from '@/components/rd'
import { fetchResearchProjects } from '@/lib/api/research'
import { ResearchProject } from '@/types/rd'

export default async function RdPageWrapper() {
  let projects: ResearchProject[] = []
  let total = 0

  try {
    const result = await fetchResearchProjects({ page: 1, page_size: 20 })
    projects = result.items
    total = result.total
  } catch (error) {
    console.warn('研发模块数据加载失败，使用空数据:', error)
  }

  return <ResearchPage initialProjects={projects} initialTotal={total} />
}
