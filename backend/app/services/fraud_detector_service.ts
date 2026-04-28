import type { OcrResult } from '#services/ocr_service'
import type Category from '#models/category'

export type FraudSignals = {
  duplicateFile: boolean
  lowOcrConfidence: boolean
  suspiciousWords: boolean
  amountExceedsCategoryLimit: boolean
}

export type FraudResult = {
  signals: FraudSignals
  score: number
  status: 'pending' | 'manual_review' | 'rejected'
  details: string
}

const SUSPICIOUS_WORDS = [
  'test',
  'fake',
  'sample',
  'lorem',
  'dummy',
  'xxxxx',
  'asdf',
  'teste',
  'falso',
]

const SIGNAL_SCORES: Record<keyof FraudSignals, number> = {
  duplicateFile: 50,
  lowOcrConfidence: 15,
  suspiciousWords: 10,
  amountExceedsCategoryLimit: 20,
}

export default class FraudDetectorService {
  analyze(ocr: OcrResult, category: Category | null, isDuplicate: boolean): FraudResult {
    const signals: FraudSignals = {
      duplicateFile: isDuplicate,
      lowOcrConfidence: ocr.confidence < 70,
      suspiciousWords: this.#hasSuspiciousWords(ocr.rawText),
      amountExceedsCategoryLimit: this.#exceedsCategoryLimit(ocr.extractedAmount, category),
    }

    const score = (Object.keys(signals) as Array<keyof FraudSignals>)
      .filter((key) => signals[key])
      .reduce((acc, key) => acc + SIGNAL_SCORES[key], 0)

    let status: FraudResult['status']
    if (score >= 70) status = 'rejected'
    else if (score >= 40) status = 'manual_review'
    else status = 'pending'

    return { signals, score, status, details: this.#buildDetails(signals, ocr.confidence) }
  }

  #hasSuspiciousWords(text: string): boolean {
    const lower = text.toLowerCase()
    return SUSPICIOUS_WORDS.some((word) => lower.includes(word))
  }

  #exceedsCategoryLimit(amount: number | null, category: Category | null): boolean {
    if (!amount || !category?.maxAmount) return false
    return amount > category.maxAmount
  }

  #buildDetails(signals: FraudSignals, confidence: number): string {
    const messages: string[] = []
    if (signals.duplicateFile) messages.push('duplicate file detected')
    if (signals.lowOcrConfidence) messages.push(`low OCR confidence (${confidence.toFixed(0)}%)`)
    if (signals.suspiciousWords) messages.push('suspicious words in text')
    if (signals.amountExceedsCategoryLimit) messages.push('amount exceeds category limit')
    return messages.length ? messages.join('; ') : 'no fraud signals detected'
  }
}
