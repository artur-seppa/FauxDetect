import type { DateTime } from 'luxon'

export type OcrResult = {
  rawText: string
  confidence: number
  extractedAmount: number | null
  extractedDate: DateTime | null
  extractedVendor: string | null
  extractedDescription: string | null
}

export interface OcrService {
  process(buffer: Buffer, mimeType: string): Promise<OcrResult>
}
