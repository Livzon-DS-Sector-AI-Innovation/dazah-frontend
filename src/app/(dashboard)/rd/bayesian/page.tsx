import { BayesianOptimizationPage } from '@/components/rd'
import { fetchProjects } from '@/lib/api/rd'
import { BayesianProject } from '@/types/rd'

export default async function BayesianPage() {
  let projects: BayesianProject[] = []

  try {
    projects = await fetchProjects()
  } catch (error) {
    console.warn('贝叶斯优化项目加载失败，使用空数据:', error)
  }

  return <BayesianOptimizationPage initialProjects={projects} />
}
