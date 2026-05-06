import { Job } from '@rlanz/bull-queue'
import { createHash } from 'node:crypto'
import drive from '@adonisjs/drive/services/main'
import queue from '@rlanz/bull-queue/services/main'
import Expense from '#models/expense'
import Category from '#models/category'
import GeminiOcrService from '#services/gemini_ocr_service'
import FraudDetectorService from '#services/fraud_detector_service'
import SendEmailJob from '#jobs/send_email_job'
import NotifyHrJob from '#jobs/notify_hr_job'

interface Payload {
  expenseId: string
}

export default class ProcessExpenseJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async handle(payload: Payload): Promise<void> {
    const expense = await Expense.query()
      .where('id', payload.expenseId)
      .preload('user')
      .firstOrFail()

    const bytes = await drive.use().getBytes(expense.filePath)
    const buffer = Buffer.from(bytes)

    const hash = createHash('sha256').update(buffer).digest('hex')

    const categories = await Category.query().where('active', true).preload('keywords')
    const selectedCategory = expense.selectedCategoryId
      ? categories.find((c) => c.id === expense.selectedCategoryId) ?? null
      : null

    const mimeType = this.#resolveMimeType(expense.originalFilename)
    const categoryContext = selectedCategory
      ? { name: selectedCategory.name, keywords: selectedCategory.keywords.map((k) => k.name) }
      : { name: '', keywords: [] }
    const ocr = await new GeminiOcrService().process(buffer, mimeType, categoryContext)

    const fraud = new FraudDetectorService().analyze(ocr, selectedCategory)
    const categoryMatch = ocr.categoryMatch ?? false

    const categoryExceedsLimit = fraud.signals.amountExceedsCategoryLimit
    const categoryExceedsLimitDetail =
      categoryExceedsLimit && ocr.extractedAmount !== null && selectedCategory?.maxAmount
        ? `Amount: ${ocr.extractedAmount}; Limit: ${selectedCategory.maxAmount}`
        : null

    await expense
      .merge({
        fileHash: hash,
        extractedAmount: ocr.extractedAmount,
        extractedDate: ocr.extractedDate,
        extractedVendor: ocr.extractedVendor,
        extractedDescription: ocr.extractedDescription,
        fraudSignals: fraud.signals,
        fraudScore: fraud.score,
        fraudDetails: fraud.details,
        categoryMatch,
        categoryExceedsLimit,
        categoryExceedsLimitDetail,
        status: fraud.status,
        rejectionReason: fraud.status === 'rejected' ? fraud.details : null,
      })
      .save()

    if (fraud.status === 'rejected') {
      await queue.dispatch(
        SendEmailJob,
        { to: expense.user.email, expenseId: expense.id, reason: fraud.details },
        { queueName: 'emails' }
      )
    }

    if (fraud.status === 'pending' || fraud.status === 'manual_review') {
      await queue.dispatch(
        NotifyHrJob,
        {
          expenseId: expense.id,
          employeeName: expense.user.fullName,
          status: fraud.status,
          fraudDetails: fraud.details,
        },
        { queueName: 'emails' }
      )
    }
  }

  async rescue(payload: Payload, error: Error): Promise<void> {
    await Expense.query().where('id', payload.expenseId).update({ status: 'manual_review' })
    console.error(`ProcessExpenseJob failed for ${payload.expenseId}:`, error.message)
  }

  #resolveMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'application/pdf'
    if (ext === 'png') return 'image/png'
    return 'image/jpeg'
  }
}
