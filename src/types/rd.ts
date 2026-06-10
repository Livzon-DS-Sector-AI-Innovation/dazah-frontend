// 研发项目类型定义

export type ResearchProjectStage = '立项' | '研发中试' | '验证' | '注册' | '商业化'
export type ResearchProjectStatus = '进行中' | '已暂停' | '已完成' | '已终止'

export interface ResearchProject {
  id: string
  project_no: string
  name: string
  project_type: string | null
  stage: ResearchProjectStage
  status: ResearchProjectStatus
  leader: string | null
  start_date: string | null
  end_date: string | null
  description: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface ResearchProjectFilters {
  stage?: ResearchProjectStage | ''
  status?: ResearchProjectStatus | ''
  keyword?: string
  page?: number
  page_size?: number
}

export interface ResearchProjectListResponse {
  items: ResearchProject[]
  total: number
  page: number
  page_size: number
}

export interface ResearchProjectCreate {
  project_no: string
  name: string
  project_type?: string | null
  stage?: ResearchProjectStage
  status?: ResearchProjectStatus
  leader?: string | null
  start_date?: string | null
  end_date?: string | null
  description?: string | null
}

export interface ResearchProjectUpdate {
  project_no?: string
  name?: string
  project_type?: string | null
  stage?: ResearchProjectStage
  status?: ResearchProjectStatus
  leader?: string | null
  start_date?: string | null
  end_date?: string | null
  description?: string | null
}

// 贝叶斯优化类型
export interface BayesianProject {
  id: string
  name: string
  description?: string
  status?: string
  created_at: string
  updated_at?: string
  components?: BayesianComponent[]
  objectives?: BayesianObjective[]
  experiments?: BayesianExperiment[]
  reaction_scopes?: ReactionScope[]
}

export interface BayesianComponent {
  id: string
  project_id: string
  name: string
  component_type: string
  min_concentration?: number
  max_concentration?: number
  created_at: string
}

export interface BayesianObjective {
  id: string
  project_id: string
  name: string
  objective_type: string
  direction?: string
  target_value?: number
  weight?: number
  created_at: string
}

export interface BayesianExperiment {
  id: string
  project_id: string
  iteration: number
  status: string
  components: Record<string, number>
  results?: Record<string, number>
  created_at: string
}

export interface ReactionScope {
  id: string
  project_id: string
  name: string
  components: BayesianComponent[]
  objectives: BayesianObjective[]
  created_at: string
}

export interface CreateProjectRequest {
  components?: Array<Omit<BayesianComponent, "id" | "project_id" | "created_at">>;
  objectives?: Array<Omit<BayesianObjective, "id" | "project_id" | "created_at">>;
  name: string
  description?: string
}

export interface SuggestExperimentsRequest {
  project_id: string
  num_experiments: number
  acquisition_function?: string
}
