export interface MockExpense {
  id: string
  userId: number
  originalFilename: string
  extractedAmount: number | null
  extractedDate: string | null
  extractedVendor: string | null
  extractedDescription: string | null
  fraudSignals: {
    duplicateFile: boolean
    amountExceedsCategoryLimit: boolean
    lowOcrConfidence: boolean
    suspiciousWords: boolean
  } | null
  fraudScore: number
  fraudDetails: string | null
  selectedCategoryId: number | null
  selectedCategory: { id: number; name: string } | null
  categoryMatch: boolean
  status: string
  rejectionReason: string | null
  approvedBy: number | null
  approvedAt: string | null
  fileUrl: string | null
  createdAt: string
  updatedAt: string
  user?: { id: number; name: string; email: string }
}

export const MOCK_CATEGORY = { id: 1, name: 'Almoço', maxAmount: 50, active: true, keywords: ['restaurante'] }

export const MOCK_PENDING_EXPENSE: MockExpense = {
  id: 'exp-001',
  userId: 1,
  originalFilename: 'nota-fiscal.png',
  extractedAmount: 45.5,
  extractedDate: '2024-01-15T12:00:00.000Z',
  extractedVendor: 'Restaurante do João',
  extractedDescription: 'Almoço executivo',
  fraudSignals: {
    duplicateFile: false,
    amountExceedsCategoryLimit: false,
    lowOcrConfidence: false,
    suspiciousWords: false,
  },
  fraudScore: 0,
  fraudDetails: null,
  selectedCategoryId: 1,
  selectedCategory: { id: 1, name: 'Almoço' },
  categoryMatch: true,
  status: 'pending',
  rejectionReason: null,
  approvedBy: null,
  approvedAt: null,
  fileUrl: '/uploads/expenses/nota-fiscal.png?signature=abc123',
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
}

export const MOCK_REJECTED_EXPENSE: MockExpense = {
  ...MOCK_PENDING_EXPENSE,
  id: 'exp-002',
  originalFilename: 'recibo-suspeito.pdf',
  extractedAmount: 89.9,
  status: 'rejected',
  rejectionReason: 'Comprovante não é válido.',
  fraudSignals: {
    duplicateFile: false,
    amountExceedsCategoryLimit: false,
    lowOcrConfidence: false,
    suspiciousWords: true,
  },
  fraudScore: 10,
}

export const MOCK_MANUAL_REVIEW_EXPENSE: MockExpense = {
  ...MOCK_PENDING_EXPENSE,
  id: 'exp-003',
  originalFilename: 'recibo-revisao.png',
  extractedAmount: 120.0,
  status: 'manual_review',
  fraudSignals: {
    duplicateFile: false,
    amountExceedsCategoryLimit: true,
    lowOcrConfidence: true,
    suspiciousWords: true,
  },
  fraudScore: 45,
}

export const HR_EXPENSES: MockExpense[] = [
  {
    ...MOCK_PENDING_EXPENSE,
    user: { id: 1, name: 'John Employee', email: 'john@company.com' },
  },
  {
    ...MOCK_REJECTED_EXPENSE,
    userId: 3,
    user: { id: 3, name: 'Jane Smith', email: 'jane@company.com' },
  },
  {
    ...MOCK_MANUAL_REVIEW_EXPENSE,
    userId: 3,
    user: { id: 3, name: 'Jane Smith', email: 'jane@company.com' },
  },
]

export const HR_PENDING_EXPENSE: MockExpense = {
  ...MOCK_PENDING_EXPENSE,
  user: { id: 1, name: 'John Employee', email: 'john@company.com' },
}
