import type { DateTime } from 'luxon'

export type OcrResult = {
  rawText: string
  confidence: number
  extractedAmount: number | null
  extractedDate: DateTime | null
  extractedVendor: string | null
  extractedDescription: string | null
  // Fraud hints provided by the OCR service (optional — not all providers return these)
  providerFraud?: {
    isTampered?: boolean
    tamperScore?: number
    isHandwritten?: boolean
    handwrittenScore?: number
    isDigital?: boolean
    digitalScore?: number
  }
}

export interface OcrService {
  process(buffer: Buffer, mimeType: string): Promise<OcrResult>
}
