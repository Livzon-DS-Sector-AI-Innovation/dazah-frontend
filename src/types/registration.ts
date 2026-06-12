// registration module TypeScript types

export interface ProductInfo {
  product_name: string
  registration_number: string
}

export interface AuthorizationLetter {
  id: string
  api_company: string
  product_name: string
  registration_number: string
  preparation_unit: string
  preparation_name: string
  administration_route: string
  template_file_name?: string
  output_file_name: string
  remarks?: string
  created_at: string
  updated_at: string
}

export interface AuthorizationLetterListItem {
  id: string
  product_name: string
  registration_number: string
  preparation_unit: string
  preparation_name: string
  administration_route: string
  output_file_name: string
  created_at: string
}

export interface AuthorizationLetterCreateInput {
  product_name: string
  registration_number: string
  preparation_unit: string
  preparation_name: string
  administration_route: string
  remarks?: string
}

export interface AuthorizationLetterListResponse {
  code: number
  message: string
  data: AuthorizationLetterListItem[]
  meta?: {
    page: number
    page_size: number
    total: number
  }
}

export interface AuthorizationLetterResponse {
  code: number
  message: string
  data: AuthorizationLetter
}

export interface ProductListResponse {
  code: number
  message: string
  data: ProductInfo[]
}

export interface AuthorizationLetterListParams {
  product_name?: string
  preparation_unit?: string
  page?: number
  page_size?: number
}

// ── 发补回复 ──

export interface SupplementaryReply {
  id: string
  drug_name: string
  registration_number?: string
  acceptance_number?: string
  company_name?: string
  notice_file_name?: string
  template_file_name?: string
  output_file_name: string
  question_count: number
  remarks?: string
  created_at: string
  updated_at: string
}

export interface SupplementaryReplyListItem {
  id: string
  drug_name: string
  registration_number?: string
  acceptance_number?: string
  output_file_name: string
  question_count: number
  created_at: string
}

export interface SupplementaryReplyListResponse {
  code: number
  message: string
  data: SupplementaryReplyListItem[]
  meta?: {
    page: number
    page_size: number
    total: number
  }
}

export interface SupplementaryReplyResponse {
  code: number
  message: string
  data: SupplementaryReply
}

export interface SupplementaryReplyListParams {
  drug_name?: string
  page?: number
  page_size?: number
}
