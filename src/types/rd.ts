// 贝叶斯优化模块类型定义

export interface BayesianComponent {
  id?: string
  project_id?: string
  name: string
  lower_bound: number
  upper_bound: number
  interval?: number
  unit?: string
  sort_order?: number
  created_at?: string
}

export interface BayesianObjective {
  id?: string
  project_id?: string
  name: string
  direction: 'maximize' | 'minimize'
  weight: number
  created_at?: string
}

export interface BayesianProject {
  id: string
  name: string
  description?: string
  status: 'draft' | 'running' | 'completed' | 'failed'
  components?: BayesianComponent[]
  objectives?: BayesianObjective[]
  created_at: string
  updated_at: string
}

export interface BayesianExperiment {
  id: string
  project_id: string
  batch_number: number
  parameters: Record<string, number>
  results?: Record<string, number>
  is_suggested: boolean
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface ReactionScope {
  id: string
  project_id: string
  name: string
  scope_data: {
    components: Record<string, {
      values: number[]
      unit?: string
    }>
    total_combinations: number
  }
  total_combinations: number
  created_at: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  components: Omit<BayesianComponent, 'id' | 'project_id' | 'created_at'>[]
  objectives: Omit<BayesianObjective, 'id' | 'project_id' | 'created_at'>[]
}

export interface SuggestExperimentsRequest {
  project_id: string
  num_experiments: number
}
