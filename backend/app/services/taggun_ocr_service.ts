import { DateTime } from 'luxon'
import env from '#start/env'
import type { OcrResult, OcrService } from '#services/ocr_service'

const TAGGUN_ENDPOINT = 'https://api.taggun.io/api/receipt/v1/verbose/file'

interface TaggunField<T> {
  data: T
  confidenceLevel: number
}

interface TaggunResponse {
  totalAmount?: TaggunField<number>
  date?: TaggunField<string>
  merchantName?: TaggunField<string>
  merchantAddress?: TaggunField<string>
  text?: { text: string }
  confidenceLevel?: number
  error?: string
}

export default class TaggunOcrService implements OcrService {
  async process(buffer: Buffer, mimeType: string): Promise<OcrResult> {
    const form = new FormData()
    const blob = new Blob([buffer], { type: mimeType })
    const filename = mimeType === 'application/pdf' ? 'receipt.pdf' : 'receipt.jpg'
    form.append('file', blob, filename)

    const response = await fetch(TAGGUN_ENDPOINT, {
      method: 'POST',
      headers: { apikey: env.get('TAGGUN_API_KEY') },
      body: form,
    })

    if (!response.ok) {
      throw new Error(`Taggun API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as TaggunResponse

    if (data.error) {
      throw new Error(`Taggun error: ${data.error}`)
    }

    return this.#parse(data)
  }

  #parse(data: TaggunResponse): OcrResult {
    const rawText = data.text?.text ?? ''
    const confidence = (data.confidenceLevel ?? 0) * 100

    const extractedAmount = data.totalAmount?.data ?? null

    let extractedDate: DateTime | null = null
    if (data.date?.data) {
      extractedDate = DateTime.fromISO(data.date.data)
      if (!extractedDate.isValid) extractedDate = null
    }

    const extractedVendor = data.merchantName?.data ?? null

    const addressPart = data.merchantAddress?.data
    const extractedDescription = addressPart
      ? [extractedVendor, addressPart].filter(Boolean).join(' — ')
      : rawText.split('\n').slice(0, 3).join(' ').trim() || null

    return {
      rawText,
      confidence,
      extractedAmount,
      extractedDate,
      extractedVendor,
      extractedDescription,
    }
  }
}
