import { DateTime } from 'luxon'
import env from '#start/env'
import type { CategoryContext, GeminiSignals, OcrResult, OcrService } from '#services/ocr_service'

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

function buildPrompt(category: CategoryContext): string {
  return `You are a receipt fraud detection expert. Analyze this receipt/invoice document and return ONLY valid JSON in exactly this format, no markdown, no explanation:
{
  "rawText": "full extracted text from document",
  "confidence": 85,
  "extractedAmount": 45.90,
  "extractedDate": "2024-01-15",
  "extractedVendor": "vendor or merchant name",
  "extractedDescription": "brief description based on vendor location or line items",
  "categoryMatch": false,
  "fraudSignals": {
    "digitalTampering": false,
    "aiGenerated": false,
    "notADocument": false,
    "inconsistentData": false
  },
  "fraudReason": null
}

Rules:
- confidence: integer 0-100 reflecting OCR quality and document clarity
- extractedAmount: number or null if not found
- extractedDate: "YYYY-MM-DD" string or null
- extractedVendor: string or null
- extractedDescription: string or null

- categoryMatch: true if the document genuinely belongs to the "${category.name}" category. Evaluate semantically — consider the vendor name, item descriptions, and overall content of the receipt. Relevant keywords for this category: [${category.keywords.join(', ')}]. The document does not need to contain these exact keywords; use them as guidance to understand the spending category. Return false if there is no meaningful match.

- digitalTampering: true if ANY of the following are observed:
  * Fonts or print quality are inconsistent between different parts of the document (e.g. logo looks sharper or blurrier than the rest of the text)
  * A logo, brand name, or header appears to be cut and pasted over the original document (different ink density, shadows, misalignment, or edges around the element)
  * Text in one section has clearly different typography, size, or color from surrounding text
  * Pixels around any element show signs of digital editing, blending, or compositing
  * Any element appears physically glued, taped, or layered on top of the original printed document

- aiGenerated: true if the document appears artificially generated, digitally created, or is a template/mock receipt. Look for these visual indicators:
  * The receipt paper texture, aging effects (stains, folds, yellowing), or wear patterns look digitally rendered rather than physically real — real aging is irregular and organic; AI-generated aging is too uniform or symmetrically placed
  * Typography is unnaturally perfect and uniform throughout — real thermal or inkjet printers produce slight variations in ink density, alignment, and character spacing; pixel-perfect text across the entire document suggests digital generation
  * The background scene (table surface, hand, wallet) has the smooth, slightly surreal quality typical of AI-generated images — look for unrealistic lighting, overly smooth surfaces, or backgrounds that feel like stock photos
  * The document layout and content look like a generic template: perfectly centered headers, evenly spaced items, round or overly clean numbers with no real-world irregularity
  * Pixel-level artifacts consistent with JPEG compression from image generation (unnaturally sharp edges between elements, banding in gradients, or inconsistent noise patterns)
  * The image overall feels "too clean" or "too composed" — like a mockup or stock photo of a receipt rather than a real photograph taken in a normal setting

- notADocument: true if ANY of the following apply:
  * The image is not a receipt, invoice, or financial document (e.g. photo of a person, food, object, or blank page)
  * The document is entirely handwritten on plain paper and claims to be an official receipt, invoice, or fiscal note ("nota fiscal") — legitimate fiscal documents are always printed, typed, or issued electronically with structured formatting, CNPJ, serial numbers, or QR codes; a handwritten piece of paper cannot be a valid official fiscal document
  * The document lacks any structure typical of a real receipt: no vendor header, no itemized list, no total line, no date

- inconsistentData: true ONLY if the final payable total cannot be reconciled with line items after accounting for all discounts, promotions, and savings lines explicitly shown on the document. Do NOT flag as inconsistent if the difference is fully explained by promotion savings, loyalty discounts, or tax lines present on the receipt.

- fraudReason: brief explanation string if any signal is true, otherwise null`
}

interface GeminiParsed {
  rawText?: string
  confidence?: number
  extractedAmount?: number | null
  extractedDate?: string | null
  extractedVendor?: string | null
  extractedDescription?: string | null
  categoryMatch?: boolean | null
  fraudSignals?: {
    digitalTampering?: boolean
    aiGenerated?: boolean
    notADocument?: boolean
    inconsistentData?: boolean
  }
  fraudReason?: string | null
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
  error?: { message: string }
}

export default class GeminiOcrService implements OcrService {
  async process(buffer: Buffer, mimeType: string, category: CategoryContext): Promise<OcrResult> {
    const apiKey = env.get('GEMINI_API_KEY')
    const base64 = buffer.toString('base64')

    const body = {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: buildPrompt(category) },
          ],
        },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    }

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as GeminiApiResponse

    if (data.error) {
      throw new Error(`Gemini error: ${data.error.message}`)
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    const parsed = JSON.parse(text) as GeminiParsed

    return this.#map(parsed)
  }

  #map(parsed: GeminiParsed): OcrResult {
    const rawText = parsed.rawText ?? ''
    const confidence = parsed.confidence ?? 0

    let extractedDate: DateTime | null = null
    if (parsed.extractedDate) {
      extractedDate = DateTime.fromISO(parsed.extractedDate)
      if (!extractedDate.isValid) extractedDate = null
    }

    const geminiSignals: GeminiSignals = {
      digitalTampering: parsed.fraudSignals?.digitalTampering ?? false,
      aiGenerated: parsed.fraudSignals?.aiGenerated ?? false,
      notADocument: parsed.fraudSignals?.notADocument ?? false,
      inconsistentData: parsed.fraudSignals?.inconsistentData ?? false,
      fraudReason: parsed.fraudReason ?? null,
    }

    return {
      rawText,
      confidence,
      extractedAmount: parsed.extractedAmount ?? null,
      extractedDate,
      extractedVendor: parsed.extractedVendor ?? null,
      extractedDescription: parsed.extractedDescription ?? null,
      categoryMatch: parsed.categoryMatch ?? null,
      geminiSignals,
    }
  }
}
