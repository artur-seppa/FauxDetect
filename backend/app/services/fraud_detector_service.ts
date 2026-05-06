import type { OcrResult } from '#services/ocr_service'
import type Category from '#models/category'

export type FraudSignals = {
  amountExceedsCategoryLimit: boolean
  geminiDigitalTampering: boolean
  geminiAiGenerated: boolean
  geminiNotADocument: boolean
  geminiInconsistentData: boolean
}

export type FraudResult = {
  signals: FraudSignals
  score: number
  status: 'pending' | 'manual_review' | 'rejected'
  details: string
}

const SIGNAL_SCORES: Record<keyof FraudSignals, number> = {
  amountExceedsCategoryLimit: 0,
  geminiDigitalTampering: 70,
  geminiAiGenerated: 70,
  geminiNotADocument: 70,
  geminiInconsistentData: 15,
}

export default class FraudDetectorService {
  analyze(ocr: OcrResult, category: Category | null): FraudResult {
    const g = ocr.geminiSignals

    const signals: FraudSignals = {
      amountExceedsCategoryLimit: this.#exceedsCategoryLimit(ocr.extractedAmount, category),
      geminiDigitalTampering: g?.digitalTampering ?? false,
      geminiAiGenerated: g?.aiGenerated ?? false,
      geminiNotADocument: g?.notADocument ?? false,
      geminiInconsistentData: g?.inconsistentData ?? false,
    }

    const score = (Object.keys(signals) as Array<keyof FraudSignals>)
      .filter((key) => signals[key])
      .reduce((acc, key) => acc + SIGNAL_SCORES[key], 0)

    let status: FraudResult['status']
    if (score >= 70) status = 'rejected'
    else if (score >= 40) status = 'manual_review'
    else status = 'pending'

    return { signals, score, status, details: this.#buildDetails(signals, ocr) }
  }

  #exceedsCategoryLimit(amount: number | null, category: Category | null): boolean {
    if (!amount || !category?.maxAmount) return false
    return amount > category.maxAmount
  }

  #buildDetails(signals: FraudSignals, ocr: OcrResult): string {
    const messages: string[] = []
    if (signals.geminiDigitalTampering) messages.push('digital tampering detected')
    if (signals.geminiAiGenerated) messages.push('AI-generated document detected')
    if (signals.geminiNotADocument) messages.push('file is not a valid document')
    if (signals.geminiInconsistentData) messages.push('inconsistent data detected')
    if (ocr.geminiSignals?.fraudReason) messages.push(ocr.geminiSignals.fraudReason)
    return messages.length ? messages.join('; ') : 'no fraud signals detected'
  }
}
