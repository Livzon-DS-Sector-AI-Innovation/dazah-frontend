// Quality management types (from shared/api.interface.ts)

// ============ Deviation Types ============
export type DeviationLevel = 'minor' | 'moderate' | 'major';
export type DeviationStatus =
  | 'draft'
  | 'pending_ai_analysis'
  | 'pending_investigation'
  | 'pending_dept_head_review'
  | 'pending_cross_dept_head_review'
  | 'pending_qa_review'
  | 'pending_qa_head_review'
  | 'pending_quality_head_review'
  | 'pending_final_code'
  | 'returned'
  | 'closed'
  | 'cancelled';

export type ApprovalStep =
  | 'ai_analysis'
  | 'investigation'
  | 'dept_head_review'
  | 'cross_dept_head_review'
  | 'qa_review'
  | 'qa_head_review'
  | 'quality_head_review'
  | 'final_code_input';

export type ReasonCategory = '人员' | '设施/设备' | '产品/物料' | '文件' | '环境' | '其它';

export interface CrossDeptReviewer {
  department: string;
  investigators: string[];
}

export interface AiAnalysis {
  description: string;
  reason: string;
  riskAssessment: string;
  capaSuggestion: string;
}

export interface InvestigationRecord {
  content?: string;
  nonconformityDescription?: string;
  rootCauseAnalysis?: string;
  riskAssessment?: string;
  urgentMeasures?: string;
  author: string;
  department?: string;
  createTime: string;
  attachments?: string[];
  isModified?: boolean;
  modifyTime?: string;
  capaProposals?: any[];
}

export interface ReviewOpinion {
  content: string;
  author: string;
  step: ApprovalStep | string;
  result: 'approved' | 'rejected' | 'resubmitted';
  createTime: string;
}

export interface DeviationListItem {
  id: string;
  deviation_code: string;
  final_code: string | null;
  title: string;
  department: string | null;
  discovery_date: string | null;
  status: DeviationStatus;
  level: DeviationLevel | null;
  root_cause_category: ReasonCategory | null;
  reporter_id: string | null;
  handler: string | null;
  status_updated_at: string | null;
  returned_step: ApprovalStep | null;
  created_at: string;
}

export interface DeviationDetail {
  id: string;
  deviation_code: string;
  final_code: string | null;
  title: string;
  department: string | null;
  discovery_date: string | null;
  discovery_time: string | null;
  discovery_location: string | null;
  status: DeviationStatus;
  level: DeviationLevel | null;
  root_cause_category: ReasonCategory | null;
  description: string | null;
  immediate_actions: string | null;
  reporter_id: string | null;
  handler: string | null;
  discoverer: string | null;
  ai_analysis: AiAnalysis | null;
  investigation_records: InvestigationRecord[] | null;
  review_opinions: ReviewOpinion[] | null;
  attachments: string[] | null;
  needs_cross_dept_review: boolean | null;
  cross_dept_reviewers: CrossDeptReviewer[] | null;
  affected_items: string | null;
  batch_number: string | null;
  returned_step: ApprovalStep | null;
  status_updated_at: string | null;
  report_content: string | null;
  report_versions: any[] | null;
  created_at: string;
  updated_at: string;
}

// ============ CAPA Types ============
export type CapaWorkflowStatus =
  | 'draft'
  | 'part_a'
  | 'part_b'
  | 'part_c'
  | 'pending_dept_head_confirm'
  | 'pending_qa_review'
  | 'pending_q_head_approval'
  | 'executing'
  | 'pending_evaluation'
  | 'submitted'
  | 'under_execution'
  | 'evaluation'
  | 'closed'
  | 'returned'
  | 'cancelled';

export type CapaSource = 'deviation' | 'audit' | 'customer_complaint' | 'internal_inspection';
export type CapaCategory = 'A' | 'B' | 'C';

export interface CapaItem {
  content: string;
  executors: string;
  expectedCompletionDate: string;
}

export interface DeptHeadConfirmation {
  department: string;
  deptHeadUserId: string;
  result: string;
  opinion: string;
  confirmTime: string;
}

export interface ExecutionTrack {
  executionStatus: string;
  execution_date?: string;
  execution_notes?: string;
  qaConfirmer?: string;
  qaConfirmDate?: string;
}

export interface CapaListItem {
  id: string;
  capa_code: string;
  final_code: string | null;
  title: string;
  status: CapaWorkflowStatus;
  source: string | null;
  source_code: string | null;
  category: CapaCategory | null;
  root_cause_category: ReasonCategory | null;
  deviation_id: string | null;
  expected_completion_date: string | null;
  status_updated_at: string | null;
  created_at: string;
}

export interface CapaDetail {
  id: string;
  capa_code: string;
  final_code: string | null;
  title: string;
  status: CapaWorkflowStatus;
  deviation_id: string | null;
  source: string | null;
  source_code: string | null;
  category: CapaCategory | null;
  root_cause_category: ReasonCategory | null;
  non_conformity_description: string | null;
  root_cause_analysis: string | null;
  capa_content: string | null;
  capa_items: CapaItem[] | null;
  executors: string[] | null;
  expected_completion_date: string | null;
  qa_reviewer_id: string | null;
  qa_review_opinion: string | null;
  qa_review_time: string | null;
  q_head_approver_id: string | null;
  q_head_approval_opinion: string | null;
  q_head_approval_time: string | null;
  execution_status: string | null;
  execution_tracks: ExecutionTrack[] | null;
  dept_head_confirmations: DeptHeadConfirmation[] | null;
  evaluation_result: string | null;
  evaluation_target: string | null;
  evaluation_deadline: string | null;
  evaluation_confirmer_id: string | null;
  evaluation_confirm_date: string | null;
  closure_date: string | null;
  closure_remark: string | null;
  report_content: string | null;
  report_versions: any[] | null;
  returned_step: string | null;
  status_updated_at: string | null;
  reporter: string | null;
  reason_category: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Department Contact Types ============
export interface DepartmentContact {
  id: string;
  department: string;
  dept_head_id: string | null;
  qa_staff_ids: string[] | null;
  gmp_staff_ids: string[] | null;
  production_head_id: string | null;
  quality_head_id: string | null;
  additional_contacts: string[] | null;
  is_production_workshop: boolean | null;
  created_at: string;
  updated_at: string;
}

// ============ Department Weekly Confirmation Types ============
export type ProductionStatus = 'production' | 'stopped';
export type DeviationConfirmationStatus = 'submitted' | 'unsubmitted';

export interface DepartmentWeeklyConfirmation {
  id: string;
  department: string;
  week_key: string;
  production_status: ProductionStatus;
  deviation_status: DeviationConfirmationStatus;
  confirmed_by_id: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Filter Types ============
export interface DeviationFilters {
  status?: DeviationStatus | '';
  level?: DeviationLevel | '';
  department?: string | '';
  keyword?: string;
  page?: number;
  page_size?: number;
}

export interface CapaFilters {
  status?: CapaWorkflowStatus | '';
  source?: CapaSource | '';
  category?: CapaCategory | '';
  keyword?: string;
  page?: number;
  page_size?: number;
}

// ============ List Response Types ============
export interface DeviationListResponse {
  items: DeviationListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface CapaListResponse {
  items: CapaListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface DepartmentContactListResponse {
  items: DepartmentContact[];
  total: number;
  page: number;
  page_size: number;
}

// ============ Create/Update Request Types ============
export interface CreateDeviationRequest {
  title: string;
  department?: string | null;
  discovery_date?: string | null;
  discovery_time?: string | null;
  discovery_location?: string | null;
  level?: DeviationLevel | null;
  root_cause_category?: ReasonCategory | null;
  description?: string | null;
  immediate_actions?: string | null;
  attachments?: string[] | null;
  affected_items?: string | null;
  batch_number?: string | null;
  handler?: string | null;
  needs_cross_dept_review?: boolean | null;
  cross_dept_reviewers?: CrossDeptReviewer[] | null;
}

export interface UpdateDeviationRequest {
  title?: string;
  status?: DeviationStatus;
  level?: DeviationLevel | null;
  department?: string | null;
  discovery_date?: string | null;
  discovery_time?: string | null;
  discovery_location?: string | null;
  root_cause_category?: ReasonCategory | null;
  description?: string | null;
  immediate_actions?: string | null;
  ai_analysis?: AiAnalysis | null;
  investigation_records?: InvestigationRecord[] | null;
  review_opinions?: ReviewOpinion[] | null;
  attachments?: string[] | null;
  final_code?: string | null;
  handler?: string | null;
  discoverer?: string | null;
  needs_cross_dept_review?: boolean | null;
  cross_dept_reviewers?: CrossDeptReviewer[] | null;
  affected_items?: string | null;
  batch_number?: string | null;
  returned_step?: ApprovalStep | null;
  report_content?: string | null;
  report_versions?: any[] | null;
}

export interface CreateCapaRequest {
  title?: string;
  deviation_id?: string | null;
  source?: string | null;
  source_code?: string | null;
  category?: CapaCategory | null;
  root_cause_category?: ReasonCategory | null;
  non_conformity_description?: string | null;
  root_cause_analysis?: string | null;
  capa_content?: string | null;
  capa_items?: CapaItem[] | null;
  executors?: string[] | null;
  expected_completion_date?: string | null;
  reporter?: string | null;
}

export interface UpdateCapaRequest {
  title?: string;
  status?: CapaWorkflowStatus;
  source?: string | null;
  source_code?: string | null;
  category?: CapaCategory | null;
  root_cause_category?: ReasonCategory | null;
  non_conformity_description?: string | null;
  root_cause_analysis?: string | null;
  capa_content?: string | null;
  capa_items?: CapaItem[] | null;
  executors?: string[] | null;
  expected_completion_date?: string | null;
  qa_reviewer_id?: string | null;
  qa_review_opinion?: string | null;
  qa_review_time?: string | null;
  q_head_approver_id?: string | null;
  q_head_approval_opinion?: string | null;
  q_head_approval_time?: string | null;
  execution_status?: string | null;
  execution_tracks?: ExecutionTrack[] | null;
  dept_head_confirmations?: DeptHeadConfirmation[] | null;
  evaluation_result?: string | null;
  evaluation_target?: string | null;
  evaluation_deadline?: string | null;
  evaluation_confirmer_id?: string | null;
  evaluation_confirm_date?: string | null;
  closure_date?: string | null;
  closure_remark?: string | null;
  final_code?: string | null;
  report_content?: string | null;
  report_versions?: any[] | null;
  returned_step?: string | null;
  reporter?: string | null;
  reason_category?: string | null;
}

export interface CreateDepartmentContactRequest {
  department: string;
  dept_head_id?: string | null;
  qa_staff_ids?: string[] | null;
  gmp_staff_ids?: string[] | null;
  production_head_id?: string | null;
  quality_head_id?: string | null;
  additional_contacts?: string[] | null;
  is_production_workshop?: boolean | null;
}

export interface UpdateDepartmentContactRequest {
  dept_head_id?: string | null;
  qa_staff_ids?: string[] | null;
  gmp_staff_ids?: string[] | null;
  production_head_id?: string | null;
  quality_head_id?: string | null;
  additional_contacts?: string[] | null;
  is_production_workshop?: boolean | null;
}


// ============ File Attachment Types ============
export interface FileAttachmentInfo {
  bucketId?: string;
  fileName?: string;
  filePath?: string;
  downloadUrl?: string;
}

// ============ Report Version Types ============
export interface ReportVersion {
  content: string;
  editor: string;
  editTime: string;
  changeSummary?: string;
}

// ============ Attachment Review Types ============
export interface AttachmentReview {
  id: string;
  deviation_id?: string;
  capa_id?: string;
  attachment_url: string;
  reviewer_id: string;
  review_time?: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}
