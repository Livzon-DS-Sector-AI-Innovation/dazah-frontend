'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// ====== 类型定义 ======
export interface SummaryStats {
  totalCount: number
  todayNewCount: number
  unreadNewCount: number
  lastSyncTime: string | null
  lastSyncStatus: string | null
}

export interface RegulatoryDocument {
  id: string
  sourceId: string
  channelId: string
  documentId: string
  title: string
  publishDate: string | null
  statusText: string | null
  classification: string | null
  originalUrl: string | null
  isNew: boolean
  isRead: boolean
  firstFoundAt: string
  lastCheckedAt: string | null
  createdAt: string
}

export interface SyncJob {
  id: string
  sourceId: string
  channelId: string
  jobType: string
  startedAt: string | null
  finishedAt: string | null
  status: string
  totalPages: number | null
  checkedCount: number
  newCount: number
  updatedCount: number
  errorMessage: string | null
  createdAt: string
}

export interface DocumentListParams {
  keyword?: string
  publishDateFrom?: string
  publishDateTo?: string
  statusText?: string
  classification?: string
  isNew?: boolean
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}


// ====== AI 分析类型 ======
export interface AIAnalysisResult {
  documentId: string
  documentTitle: string
  impactLevel: 'high' | 'medium' | 'low' | 'none'
  impactScore: number // 0-100
  impactSummary: string
  keyChanges: string[]
  impactAreas: string[]
  complianceSuggestions: string[]
  timelineUrgency: 'urgent' | 'normal' | 'long_term'
  generatedAt: string
}

export interface AIBatchAnalysisResult {
  totalAnalyzed: number
  highImpact: number
  mediumImpact: number
  lowImpact: number
  noneImpact: number
  topConcerns: Array<{
    title: string
    documentId: string
    impactLevel: 'high' | 'medium' | 'low' | 'none'
    reason: string
  }>
  overallAssessment: string
  generatedAt: string
}

// Mock AI 分析数据（未来替换为真实 API 调用）
const MOCK_AI_ANALYSIS: Record<string, AIAnalysisResult> = {}

function generateMockAnalysis(doc: RegulatoryDocument): AIAnalysisResult {
  const title = doc.title || ''
  const classification = doc.classification || ''
  const isChemical = classification.includes('化学') || title.includes('化学') || title.includes('原料药') || title.includes('API')
  const isBio = classification.includes('生物') || title.includes('生物')
  const isBE = title.includes('生物等效性') || title.includes('BE')
  const isPharma = title.includes('药学') || title.includes('制剂') || title.includes('处方')
  const isQuality = title.includes('质量') || title.includes('稳定性') || title.includes('杂质')

  let impactLevel: 'high' | 'medium' | 'low' | 'none' = 'low'
  let impactScore = 30
  let impactSummary = '该法规对化学原料药业务影响较小，建议常规关注。'
  const keyChanges: string[] = []
  const impactAreas: string[] = []
  const complianceSuggestions: string[] = []
  let timelineUrgency: 'urgent' | 'normal' | 'long_term' = 'long_term'

  if (isChemical && isBE) {
    impactLevel = 'medium'
    impactScore = 55
    impactSummary = '该指导原则涉及化学药生物等效性研究要求，可能影响原料药供应商变更时的桥接研究策略。'
    keyChanges.push('明确生物等效性试验设计要求', '规定参比制剂选择标准')
    impactAreas.push('供应商变更评估', '工艺验证策略')
    complianceSuggestions.push('评估现有供应商变更是否触发 BE 研究', '更新变更控制流程')
    timelineUrgency = 'normal'
  } else if (isChemical && isPharma) {
    impactLevel = 'high'
    impactScore = 80
    impactSummary = '该指导原则直接涉及化学药药学研究要求，对原料药生产工艺和质量控制有重大影响。'
    keyChanges.push('更新原料药生产工艺验证要求', '强化关键质量属性控制', '提高杂质限度要求')
    impactAreas.push('生产工艺', '质量控制', '供应商管理', '注册申报')
    complianceSuggestions.push('对照新规逐项评估现有工艺合规性', '更新关键工艺参数控制策略', '准备补充申报资料')
    timelineUrgency = 'urgent'
  } else if (isQuality && (isChemical || !isBio)) {
    impactLevel = 'high'
    impactScore = 75
    impactSummary = '质量相关指导原则更新，直接影响原料药质量标准制定和控制策略。'
    keyChanges.push('调整杂质谱分析方法', '强化稳定性研究要求', '更新质量标准限度')
    impactAreas.push('质量标准', '稳定性研究', '分析方法')
    complianceSuggestions.push('审查现有质量标准是否符合新规', '评估是否需要进行补充稳定性研究')
    timelineUrgency = 'normal'
  } else if (isChemical) {
    impactLevel = 'medium'
    impactScore = 50
    impactSummary = '该指导原则涉及化学药领域，对原料药业务有中等程度影响，建议重点评估相关条款。'
    keyChanges.push('更新相关技术要求', '调整研究策略')
    impactAreas.push('注册申报', '合规评估')
    complianceSuggestions.push('组织技术团队研读新规重点条款', '评估对现有品种的潜在影响')
    timelineUrgency = 'normal'
  } else if (title.includes('中药')) {
    impactLevel = 'none'
    impactScore = 5
    impactSummary = '该指导原则仅针对中药领域，与化学原料药业务无直接关联。'
  } else {
    impactLevel = 'low'
    impactScore = 20
    impactSummary = '该指导原则主要涉及其他药品类型，对化学原料药影响有限，建议保持关注。'
  }

  return {
    documentId: doc.id,
    documentTitle: title,
    impactLevel,
    impactScore,
    impactSummary,
    keyChanges,
    impactAreas,
    complianceSuggestions,
    timelineUrgency,
    generatedAt: new Date().toISOString(),
  }
}

// ====== API 调用 ======
export async function fetchSummary(): Promise<SummaryStats> {
  const res = await fetch(`${API_BASE_URL}/api/v1/regulatory-tracker/summary`)
  const json: ApiResponse<SummaryStats> = await res.json()
  return json.data
}

export async function fetchDocuments(
  params: DocumentListParams = {}
): Promise<PaginatedResponse<RegulatoryDocument>> {
  const searchParams = new URLSearchParams()
  
  if (params.keyword) searchParams.append('keyword', params.keyword)
  if (params.publishDateFrom) searchParams.append('publishDateFrom', params.publishDateFrom)
  if (params.publishDateTo) searchParams.append('publishDateTo', params.publishDateTo)
  if (params.statusText) searchParams.append('statusText', params.statusText)
  if (params.classification) searchParams.append('classification', params.classification)
  if (params.isNew !== undefined) searchParams.append('isNew', params.isNew.toString())
  if (params.page) searchParams.append('page', params.page.toString())
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString())

  const url = `${API_BASE_URL}/api/v1/regulatory-documents?${searchParams.toString()}`
  const res = await fetch(url)
  const json: ApiResponse<PaginatedResponse<RegulatoryDocument>> = await res.json()
  return json.data
}

export async function markDocumentRead(id: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/v1/regulatory-documents/${id}/read`, {
    method: 'PATCH',
  })
}

export async function fetchSyncJobs(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<SyncJob>> {
  const url = `${API_BASE_URL}/api/v1/sync-jobs?page=${page}&pageSize=${pageSize}`
  const res = await fetch(url)
  const json: ApiResponse<PaginatedResponse<SyncJob>> = await res.json()
  return json.data
}


// ====== AI 分析 API（当前为 mock，未来替换为真实接口） ======

/**
 * 单条文档 AI 分析
 * 当前返回基于规则引擎的 mock 结果，未来将调用后端 LLM 接口
 */
export async function fetchAIAnalysis(
  doc: RegulatoryDocument
): Promise<AIAnalysisResult> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800))
  // TODO: 替换为真实 API 调用
  // const res = await fetch(`${API_BASE_URL}/api/v1/regulatory-documents/${doc.id}/ai-analysis`)
  // const json: ApiResponse<AIAnalysisResult> = await res.json()
  // return json.data
  return generateMockAnalysis(doc)
}

/**
 * 批量文档 AI 分析（化学原料药视角）
 * 当前返回基于规则引擎的 mock 结果，未来将调用后端 LLM 接口
 */
export async function fetchAIBatchAnalysis(
  docs: RegulatoryDocument[]
): Promise<AIBatchAnalysisResult> {
  await new Promise(resolve => setTimeout(resolve, 1500))
  // TODO: 替换为真实 API 调用
  // const res = await fetch(`${API_BASE_URL}/api/v1/regulatory-documents/ai-batch-analysis`, { method: 'POST', body: JSON.stringify({ documentIds: docs.map(d => d.id) }) })
  // const json: ApiResponse<AIBatchAnalysisResult> = await res.json()
  // return json.data

  const analyses = docs.map(d => generateMockAnalysis(d))
  const highImpact = analyses.filter(a => a.impactLevel === 'high').length
  const mediumImpact = analyses.filter(a => a.impactLevel === 'medium').length
  const lowImpact = analyses.filter(a => a.impactLevel === 'low').length
  const noneImpact = analyses.filter(a => a.impactLevel === 'none').length

  const topConcerns = analyses
    .filter(a => a.impactLevel === 'high' || a.impactLevel === 'medium')
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 5)
    .map(a => ({
      title: a.documentTitle,
      documentId: a.documentId,
      impactLevel: a.impactLevel,
      reason: a.impactSummary,
    }))

  const total = analyses.length
  const overallAssessment = highImpact > 0
    ? `在 ${total} 条法规中，有 ${highImpact} 条对化学原料药业务存在重大影响，建议优先评估并制定应对方案。`
    : mediumImpact > 0
    ? `在 ${total} 条法规中，有 ${mediumImpact} 条对化学原料药业务存在中等影响，建议组织技术团队重点研读。`
    : `在 ${total} 条法规中，未发现对化学原料药业务有重大影响的法规，建议保持常规关注。`

  return {
    totalAnalyzed: total,
    highImpact,
    mediumImpact,
    lowImpact,
    noneImpact,
    topConcerns,
    overallAssessment,
    generatedAt: new Date().toISOString(),
  }
}
