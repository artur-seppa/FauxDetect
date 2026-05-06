import type { DateTime } from 'luxon'

export type GeminiSignals = {
  digitalTampering: boolean
  aiGenerated: boolean
  notADocument: boolean
  inconsistentData: boolean
  fraudReason: string | null
}

export type CategoryContext = {
  name: string
  keywords: string[]
}

export type OcrResult = {
  rawText: string
  confidence: number
  extractedAmount: number | null
  extractedDate: DateTime | null
  extractedVendor: string | null
  extractedDescription: string | null
  categoryMatch: boolean | null
  geminiSignals?: GeminiSignals
}

export interface OcrService {
  process(buffer: Buffer, mimeType: string, category: CategoryContext): Promise<OcrResult>
}
