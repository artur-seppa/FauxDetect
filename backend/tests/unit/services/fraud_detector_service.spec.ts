import { test } from '@japa/runner'
import FraudDetectorService from '#services/fraud_detector_service'
import type { OcrResult } from '#services/ocr_service'

const baseOcr: OcrResult = {
  rawText: 'Receipt from Cafe Brasil',
  confidence: 90,
  extractedAmount: 50,
  extractedDate: null,
  extractedVendor: 'Cafe Brasil',
  extractedDescription: 'Lunch at Cafe Brasil',
}

test.group('FraudDetectorService', () => {
  test('returns pending when no fraud signals', ({ assert }) => {
    const result = new FraudDetectorService().analyze(baseOcr)

    assert.equal(result.status, 'pending')
    assert.equal(result.score, 0)
    assert.isFalse(result.signals.lowOcrConfidence)
    assert.isFalse(result.signals.suspiciousWords)
    assert.isFalse(result.signals.handwrittenReceipt)
  })

  test('adds 40 points for low OCR confidence', ({ assert }) => {
    const ocr = { ...baseOcr, confidence: 60 }
    const result = new FraudDetectorService().analyze(ocr)

    assert.isTrue(result.signals.lowOcrConfidence)
    assert.equal(result.score, 40)
    assert.equal(result.status, 'manual_review')
  })

  test('stores ocrConfidenceValue in signals', ({ assert }) => {
    const ocr = { ...baseOcr, confidence: 67 }
    const result = new FraudDetectorService().analyze(ocr)

    assert.equal(result.signals.ocrConfidenceValue, 67)
  })

  test('adds 20 points for suspicious words in raw text', ({ assert }) => {
    const ocr = { ...baseOcr, rawText: 'This is a test receipt' }
    const result = new FraudDetectorService().analyze(ocr)

    assert.isTrue(result.signals.suspiciousWords)
    assert.equal(result.score, 20)
    assert.equal(result.status, 'pending')
  })

  test('detects handwritten receipt when confidence is moderate and text is long enough', ({ assert }) => {
    const ocr = {
      ...baseOcr,
      confidence: 71,
      rawText: 'one two three four five six seven eight nine ten',
    }
    const result = new FraudDetectorService().analyze(ocr)

    assert.isTrue(result.signals.handwrittenReceipt)
  })

  test('adds 40 points for handwritten receipt', ({ assert }) => {
    const ocr = {
      ...baseOcr,
      confidence: 71, // above lowOcrConfidence threshold (70) but inside handwritten range (< 72)
      rawText: 'one two three four five six seven eight nine ten',
    }
    const result = new FraudDetectorService().analyze(ocr)

    assert.isTrue(result.signals.handwrittenReceipt)
    assert.isFalse(result.signals.lowOcrConfidence)
    assert.equal(result.score, 40)
    assert.equal(result.status, 'manual_review')
  })

  test('does not flag handwritten receipt when confidence is high', ({ assert }) => {
    const result = new FraudDetectorService().analyze({ ...baseOcr, confidence: 85 })

    assert.isFalse(result.signals.handwrittenReceipt)
  })

  test('does not flag handwritten receipt when text is too short', ({ assert }) => {
    const ocr = { ...baseOcr, confidence: 55, rawText: 'one two three' }
    const result = new FraudDetectorService().analyze(ocr)

    assert.isFalse(result.signals.handwrittenReceipt)
  })

  test('uses provider isHandwritten flag when present', ({ assert }) => {
    const ocr = { ...baseOcr, providerFraud: { isHandwritten: true } }
    const result = new FraudDetectorService().analyze(ocr)

    assert.isTrue(result.signals.handwrittenReceipt)
  })

  test('returns rejected when score >= 70', ({ assert }) => {
    const ocr = {
      ...baseOcr,
      confidence: 55,
      rawText: 'one two three four five six seven eight nine test fake',
    }
    const result = new FraudDetectorService().analyze(ocr)

    assert.isAtLeast(result.score, 70)
    assert.equal(result.status, 'rejected')
  })

  test('returns manual_review when score is between 40 and 69', ({ assert }) => {
    const ocr = { ...baseOcr, confidence: 60 }
    const result = new FraudDetectorService().analyze(ocr)

    assert.equal(result.score, 40)
    assert.equal(result.status, 'manual_review')
  })

  test('details string lists all triggered signals', ({ assert }) => {
    const ocr = { ...baseOcr, confidence: 60 }
    const result = new FraudDetectorService().analyze(ocr)

    assert.include(result.details, 'low OCR confidence')
  })

  test('details string says no fraud signals when score is zero', ({ assert }) => {
    const result = new FraudDetectorService().analyze(baseOcr)

    assert.equal(result.details, 'no fraud signals detected')
  })
})
