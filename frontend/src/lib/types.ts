export type Role = 'employee' | 'hr' | 'admin'

export type ExpenseStatus = 'processing' | 'pending' | 'approved' | 'rejected' | 'manual_review'

export interface User {
  id: number
  email: string
  fullName: string
  role: Role
  department: string | null
}

export interface Category {
  id: number
  name: string
  maxAmount: number | null
  active: boolean
  keywords: string[]
}

export interface FraudSignals {
  amountExceedsCategoryLimit: boolean
  geminiDigitalTampering: boolean
  geminiAiGenerated: boolean
  geminiNotADocument: boolean
  geminiInconsistentData: boolean
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
  selectedCategory?: Category
  category?: Category
  categoryMatch: boolean
  categoryExceedsLimit: boolean | null
  categoryExceedsLimitDetail: string | null
  status: ExpenseStatus
  rejectionReason: string | null
  approvedBy: number | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
  fileUrl?: string
}

export interface HrDashboard {
  pending: number
  manualReview: number
  approvedToday: number
  rejectedToday: number
  statusDistribution: { status: string; total: number }[]
  expensesByUser: { name: string; total: number }[]
  fraudSignalCounts: { signal: string; total: number }[]
  expensesByDay: { day: string; total: number }[]
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
