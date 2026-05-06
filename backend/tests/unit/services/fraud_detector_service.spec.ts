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
  categoryMatch: null,
}

const withGemini = (overrides: {
  digitalTampering?: boolean
  aiGenerated?: boolean
  notADocument?: boolean
  inconsistentData?: boolean
}): OcrResult => ({
  ...baseOcr,
  geminiSignals: {
    digitalTampering: overrides.digitalTampering ?? false,
    aiGenerated: overrides.aiGenerated ?? false,
    notADocument: overrides.notADocument ?? false,
    inconsistentData: overrides.inconsistentData ?? false,
    fraudReason: null,
  },
})

const fakeCategory = (maxAmount: number | null) =>
  ({ name: 'Lunch', maxAmount, active: true }) as any

test.group('FraudDetectorService', () => {
  test('returns pending with score 0 when no fraud signals', ({ assert }) => {
    const result = new FraudDetectorService().analyze(baseOcr, null)

    assert.equal(result.status, 'pending')
    assert.equal(result.score, 0)
    assert.isFalse(result.signals.geminiAiGenerated)
    assert.isFalse(result.signals.geminiDigitalTampering)
    assert.isFalse(result.signals.geminiNotADocument)
    assert.isFalse(result.signals.geminiInconsistentData)
    assert.isFalse(result.signals.amountExceedsCategoryLimit)
  })

  test('returns rejected when geminiAiGenerated is true', ({ assert }) => {
    const result = new FraudDetectorService().analyze(withGemini({ aiGenerated: true }), null)

    assert.isTrue(result.signals.geminiAiGenerated)
    assert.equal(result.score, 70)
    assert.equal(result.status, 'rejected')
  })

  test('returns rejected when geminiDigitalTampering is true', ({ assert }) => {
    const result = new FraudDetectorService().analyze(withGemini({ digitalTampering: true }), null)

    assert.isTrue(result.signals.geminiDigitalTampering)
    assert.equal(result.score, 70)
    assert.equal(result.status, 'rejected')
  })

  test('returns rejected when geminiNotADocument is true', ({ assert }) => {
    const result = new FraudDetectorService().analyze(withGemini({ notADocument: true }), null)

    assert.isTrue(result.signals.geminiNotADocument)
    assert.equal(result.score, 70)
    assert.equal(result.status, 'rejected')
  })

  test('returns pending with score 15 when only geminiInconsistentData is true', ({ assert }) => {
    const result = new FraudDetectorService().analyze(withGemini({ inconsistentData: true }), null)

    assert.isTrue(result.signals.geminiInconsistentData)
    assert.equal(result.score, 15)
    assert.equal(result.status, 'pending')
  })

  test('amountExceedsCategoryLimit does not contribute to fraud score', ({ assert }) => {
    const ocr = { ...baseOcr, extractedAmount: 200 }
    const result = new FraudDetectorService().analyze(ocr, fakeCategory(100))

    assert.isTrue(result.signals.amountExceedsCategoryLimit)
    assert.equal(result.score, 0)
    assert.equal(result.status, 'pending')
  })

  test('does not flag amountExceedsCategoryLimit when category has no limit', ({ assert }) => {
    const ocr = { ...baseOcr, extractedAmount: 9999 }
    const result = new FraudDetectorService().analyze(ocr, fakeCategory(null))

    assert.isFalse(result.signals.amountExceedsCategoryLimit)
  })

  test('returns rejected when multiple gemini signals combine above 70', ({ assert }) => {
    const result = new FraudDetectorService().analyze(
      withGemini({ inconsistentData: true, aiGenerated: true }),
      null
    )

    assert.isAtLeast(result.score, 70)
    assert.equal(result.status, 'rejected')
  })

  test('details string lists triggered gemini signals', ({ assert }) => {
    const result = new FraudDetectorService().analyze(
      withGemini({ aiGenerated: true, inconsistentData: true }),
      null
    )

    assert.include(result.details, 'AI-generated document detected')
    assert.include(result.details, 'inconsistent data detected')
  })

  test('details returns no fraud signals when score is zero', ({ assert }) => {
    const result = new FraudDetectorService().analyze(baseOcr, null)

    assert.equal(result.details, 'no fraud signals detected')
  })
})
