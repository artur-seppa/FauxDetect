import type { OcrResult } from '#services/ocr_service'

export type SignalKey = 'lowOcrConfidence' | 'suspiciousWords' | 'handwrittenReceipt'

export type FraudSignals = {
  lowOcrConfidence: boolean
  ocrConfidenceValue: number
  suspiciousWords: boolean
  handwrittenReceipt: boolean
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

const SIGNAL_SCORES: Record<SignalKey, number> = {
  lowOcrConfidence: 40,
  suspiciousWords: 20,
  handwrittenReceipt: 40,
}

export default class FraudDetectorService {
  analyze(ocr: OcrResult): FraudResult {
    const signals: FraudSignals = {
      lowOcrConfidence: ocr.confidence < 70,
      ocrConfidenceValue: ocr.confidence,
      suspiciousWords: this.#hasSuspiciousWords(ocr.rawText),
      handwrittenReceipt: ocr.providerFraud?.isHandwritten ?? this.#isHandwritten(ocr),
    }

    const score = (Object.keys(SIGNAL_SCORES) as SignalKey[])
      .filter((key) => signals[key])
      .reduce((acc, key) => acc + SIGNAL_SCORES[key], 0)

    let status: FraudResult['status']
    if (score >= 70) status = 'rejected'
    else if (score >= 40) status = 'manual_review'
    else status = 'pending'

    return { signals, score, status, details: this.#buildDetails(signals) }
  }

  #hasSuspiciousWords(text: string): boolean {
    const lower = text.toLowerCase()
    return SUSPICIOUS_WORDS.some((word) => lower.includes(word))
  }

  #isHandwritten(ocr: OcrResult): boolean {
    const wordCount = ocr.rawText.trim().split(/\s+/).filter(Boolean).length
    return ocr.confidence >= 30 && ocr.confidence < 72 && wordCount > 5
  }

  #buildDetails(signals: FraudSignals): string {
    const messages: string[] = []
    if (signals.lowOcrConfidence)
      messages.push(`low OCR confidence (${signals.ocrConfidenceValue.toFixed(0)}%)`)
    if (signals.suspiciousWords) messages.push('suspicious words in text')
    if (signals.handwrittenReceipt) messages.push('handwritten receipt detected')
    return messages.length ? messages.join('; ') : 'no fraud signals detected'
  }
}
