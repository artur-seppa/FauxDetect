export type Role = 'employee' | 'hr' | 'admin'

export type ExpenseStatus = 'processing' | 'pending' | 'approved' | 'rejected' | 'manual_review'

export interface User {
  id: number
  email: string
  name: string
  role: Role
  department: string | null
}

export interface Category {
  id: number
  name: string
  maxAmount: number | null
  active: boolean
}

export interface FraudSignals {
  duplicate_file: boolean
  amount_exceeds_category_limit: boolean
  low_ocr_confidence: boolean
  suspicious_words: boolean
}

export interface Expense {
  id: number
  userId: number
  user?: User
  originalFilename: string
  fileHash: string
  extractedAmount: number | null
  extractedDate: string | null
  extractedVendor: string | null
  extractedDescription: string | null
  fraudSignals: FraudSignals | null
  fraudScore: number
  fraudDetails: string | null
  selectedCategoryId: number | null
  category?: Category
  categoryMatch: boolean
  status: ExpenseStatus
  rejectionReason: string | null
  approvedBy: number | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface HrDashboard {
  pending: number
  manualReview: number
  approvedToday: number
  rejectedToday: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

export interface AuthResponse {
  token: string
  user: User
}
