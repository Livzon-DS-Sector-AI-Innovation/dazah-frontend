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
