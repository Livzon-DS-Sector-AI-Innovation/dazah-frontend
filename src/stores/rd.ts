// 贝叶斯优化状态管理
import { create } from 'zustand'
import { 
  BayesianProject, 
  BayesianComponent, 
  BayesianObjective, 
  BayesianExperiment,
  ReactionScope
} from '@/types/rd'

interface RDState {
  // 项目
  projects: BayesianProject[]
  currentProject: BayesianProject | null
  
  // 组件和目标
  components: BayesianComponent[]
  objectives: BayesianObjective[]
  
  // 实验
  experiments: BayesianExperiment[]
  
  // 反应范围
  reactionScopes: ReactionScope[]
  
  // UI 状态
  loading: boolean
  error: string | null
  
  // Actions
  setProjects: (projects: BayesianProject[]) => void
  setCurrentProject: (project: BayesianProject | null) => void
  setComponents: (components: BayesianComponent[]) => void
  setObjectives: (objectives: BayesianObjective[]) => void
  setExperiments: (experiments: BayesianExperiment[]) => void
  setReactionScopes: (scopes: ReactionScope[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  projects: [],
  currentProject: null,
  components: [],
  objectives: [],
  experiments: [],
  reactionScopes: [],
  loading: false,
  error: null,
}

export const useRDStore = create<RDState>((set) => ({
  ...initialState,
  
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setComponents: (components) => set({ components }),
  setObjectives: (objectives) => set({ objectives }),
  setExperiments: (experiments) => set({ experiments }),
  setReactionScopes: (scopes) => set({ reactionScopes: scopes }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
