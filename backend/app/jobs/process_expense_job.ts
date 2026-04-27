import { Job } from '@rlanz/bull-queue'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import queue from '@rlanz/bull-queue/services/main'
import Expense from '#models/expense'
import Category from '#models/category'
import TaggunOcrService from '#services/taggun_ocr_service'
import FraudDetectorService from '#services/fraud_detector_service'
import SendEmailJob from '#jobs/send_email_job'

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

    const filePath = app.makePath('storage', expense.filePath)
    const buffer = await readFile(filePath)

    const hash = createHash('sha256').update(buffer).digest('hex')
    const isDuplicate =
      hash !== expense.fileHash &&
      (await Expense.query().where('file_hash', hash).whereNot('id', expense.id).first()) !== null

    const mimeType = this.#resolveMimeType(expense.originalFilename)
    const ocr = await new TaggunOcrService().process(buffer, mimeType)

    const categories = await Category.query().where('active', true)
    const selectedCategory = expense.selectedCategoryId
      ? categories.find((c) => c.id === expense.selectedCategoryId) ?? null
      : null

    const fraud = new FraudDetectorService().analyze(ocr, selectedCategory, isDuplicate)

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
        status: fraud.status,
        rejectionReason: fraud.status === 'rejected' ? fraud.details : null,
      })
      .save()

    if (fraud.status === 'rejected') {
      await queue.dispatch(SendEmailJob, {
        to: expense.user.email,
        expenseId: expense.id,
        reason: fraud.details,
      })
    }
  }

  async rescue(payload: Payload, error: Error): Promise<void> {
    await Expense.query().where('id', payload.expenseId).update({ status: 'manual_review' })
    console.error(`ProcessExpenseJob failed for ${payload.expenseId}:`, error.message)
  }

  #resolveMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'application/pdf'
    return 'image/jpeg'
  }
}
