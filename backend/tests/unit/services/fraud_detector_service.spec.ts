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

const fakeCategory = (maxAmount: number | null) =>
  ({ name: 'Lunch', maxAmount, active: true }) as any

test.group('FraudDetectorService', () => {
  test('returns pending when no fraud signals', ({ assert }) => {
    const result = new FraudDetectorService().analyze(baseOcr, null, false)

    assert.equal(result.status, 'pending')
    assert.equal(result.score, 0)
    assert.isFalse(result.signals.duplicateFile)
    assert.isFalse(result.signals.lowOcrConfidence)
    assert.isFalse(result.signals.suspiciousWords)
    assert.isFalse(result.signals.amountExceedsCategoryLimit)
  })

  test('adds 50 points for duplicate file', ({ assert }) => {
    const result = new FraudDetectorService().analyze(baseOcr, null, true)

    assert.isTrue(result.signals.duplicateFile)
    assert.equal(result.score, 50)
    assert.equal(result.status, 'manual_review')
  })

  test('adds 15 points for low OCR confidence', ({ assert }) => {
    const ocr = { ...baseOcr, confidence: 60 }
    const result = new FraudDetectorService().analyze(ocr, null, false)

    assert.isTrue(result.signals.lowOcrConfidence)
    assert.equal(result.score, 15)
  })

  test('adds 10 points for suspicious words in raw text', ({ assert }) => {
    const ocr = { ...baseOcr, rawText: 'This is a test receipt' }
    const result = new FraudDetectorService().analyze(ocr, null, false)

    assert.isTrue(result.signals.suspiciousWords)
    assert.equal(result.score, 10)
  })

  test('adds 20 points when amount exceeds category limit', ({ assert }) => {
    const ocr = { ...baseOcr, extractedAmount: 150 }
    const result = new FraudDetectorService().analyze(ocr, fakeCategory(100), false)

    assert.isTrue(result.signals.amountExceedsCategoryLimit)
    assert.equal(result.score, 20)
  })

  test('does not flag amount when category has no limit', ({ assert }) => {
    const ocr = { ...baseOcr, extractedAmount: 9999 }
    const result = new FraudDetectorService().analyze(ocr, fakeCategory(null), false)

    assert.isFalse(result.signals.amountExceedsCategoryLimit)
  })

  test('returns rejected when score >= 70', ({ assert }) => {
    const ocr = { ...baseOcr, confidence: 60 }
    const result = new FraudDetectorService().analyze(ocr, null, true)

    assert.isAtLeast(result.score, 70)
    assert.equal(result.status, 'rejected')
  })

  test('returns manual_review when score is between 40 and 69', ({ assert }) => {
    const result = new FraudDetectorService().analyze(baseOcr, null, true)

    assert.equal(result.score, 50)
    assert.equal(result.status, 'manual_review')
  })

  test('details string lists all triggered signals', ({ assert }) => {
    const ocr = { ...baseOcr, confidence: 60 }
    const result = new FraudDetectorService().analyze(ocr, null, true)

    assert.include(result.details, 'duplicate file')
    assert.include(result.details, 'low OCR confidence')
  })

  test('details string says no fraud signals when score is zero', ({ assert }) => {
    const result = new FraudDetectorService().analyze(baseOcr, null, false)

    assert.equal(result.details, 'no fraud signals detected')
  })
})
