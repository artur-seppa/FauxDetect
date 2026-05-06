import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import drive from '@adonisjs/drive/services/main'
import db from '@adonisjs/lucid/services/db'
import queue from '@rlanz/bull-queue/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { ulid } from 'ulidx'
import Expense from '#models/expense'
import ExpensePolicy from '#policies/expense_policy'
import ProcessExpenseJob from '#jobs/process_expense_job'
import { storeExpenseValidator, rejectExpenseValidator } from '#validators/expense_validator'


export default class ExpensesController {
  async index({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const query = Expense.query()
      .preload('selectedCategory')
      .preload('user', (q) => q.select(['id', 'fullName', 'email']))
      .orderBy('created_at', 'desc')

    if (user.role === 'employee') {
      query.where('user_id', user.id)
    }

    const status = request.input('status')
    if (status) {
      query.where('status', status)
    }

    const expenses = await query
    return response.ok(expenses)
  }

  async show({ bouncer, params, response }: HttpContext) {
    const expense = await Expense.query()
      .where('id', params.id)
      .preload('selectedCategory')
      .preload('user', (q) => q.select(['id', 'fullName', 'email']))
      .preload('approver', (q) => q.select(['id', 'fullName', 'email']))
      .firstOrFail()

    await bouncer.with(ExpensePolicy).authorize('view', expense)

    const fileUrl = await drive.use().getSignedUrl(expense.filePath, { expiresIn: '30m' })
    return response.ok({ ...expense.serialize(), fileUrl })
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const data = await request.validateUsing(storeExpenseValidator)

    const buffer = await readFile(data.receipt.tmpPath!)
    const fileHash = createHash('sha256').update(buffer).digest('hex')

    const duplicate = await Expense.query()
      .where('fileHash', fileHash)
      .whereNot('status', 'rejected')
      .first()

    if (duplicate) {
      return response.conflict({ message: 'This file has already been submitted' })
    }

    const key = `expenses/${ulid()}.${data.receipt.extname}`
    await data.receipt.moveToDisk(key)

    const expense = await Expense.create({
      userId: user.id,
      originalFilename: data.receipt.clientName,
      filePath: key,
      fileHash,
      selectedCategoryId: data.selectedCategoryId,
      employeeDescription: data.employeeDescription ?? null,
      status: 'processing',
    })

    await queue.dispatch(ProcessExpenseJob, { expenseId: expense.id }, { queueName: 'expenses' })

    return response.created(expense)
  }

  async approve({ bouncer, auth, params, response }: HttpContext) {
    await bouncer.with(ExpensePolicy).authorize('approve')

    const expense = await Expense.findOrFail(params.id)

    if (expense.status !== 'pending' && expense.status !== 'manual_review') {
      return response.unprocessableEntity({
        message: 'Only pending or under review expenses can be approved',
      })
    }

    const user = auth.user!

    expense.merge({
      status: 'approved',
      approvedBy: user.id,
      approvedAt: DateTime.now(),
    })

    await expense.save()

    return response.ok(expense)
  }

  async reject({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(ExpensePolicy).authorize('reject')

    const expense = await Expense.findOrFail(params.id)

    if (expense.status !== 'pending' && expense.status !== 'manual_review') {
      return response.unprocessableEntity({
        message: 'Only pending or under review expenses can be rejected',
      })
    }

    const data = await request.validateUsing(rejectExpenseValidator)

    expense.merge({
      status: 'rejected',
      rejectionReason: data.rejectionReason,
    })

    await expense.save()

    return response.ok(expense)
  }

  async dashboard({ response }: HttpContext) {
    const today = DateTime.now().toISODate()

    const [
      pending,
      manualReview,
      approvedToday,
      rejectedToday,
      statusDistResult,
      expensesByUserResult,
      fraudSignalsResult,
      expensesByDayResult,
    ] = await Promise.all([
      Expense.query().where('status', 'pending').count('* as total').first(),
      Expense.query().where('status', 'manual_review').count('* as total').first(),
      Expense.query()
        .where('status', 'approved')
        .whereRaw('DATE(approved_at) = ?', [today])
        .count('* as total')
        .first(),
      Expense.query()
        .where('status', 'rejected')
        .whereRaw('DATE(updated_at) = ?', [today])
        .count('* as total')
        .first(),
      db.rawQuery<{ rows: { status: string; total: number }[] }>(
        'SELECT status, COUNT(*)::int AS total FROM expenses GROUP BY status ORDER BY status'
      ),
      db.rawQuery<{ rows: { name: string; total: number }[] }>(`
        SELECT u.full_name AS name, COUNT(e.id)::int AS total
        FROM expenses e
        JOIN users u ON e.user_id = u.id
        GROUP BY u.id, u.full_name
        ORDER BY total DESC
        LIMIT 10
      `),
      db.rawQuery<{
        rows: {
          amount_exceeds_category_limit: number
          gemini_digital_tampering: number
          gemini_ai_generated: number
          gemini_not_a_document: number
          gemini_inconsistent_data: number
        }[]
      }>(`
        SELECT
          SUM(CASE WHEN (fraud_signals->>'amountExceedsCategoryLimit')::boolean THEN 1 ELSE 0 END)::int AS amount_exceeds_category_limit,
          SUM(CASE WHEN (fraud_signals->>'geminiDigitalTampering')::boolean THEN 1 ELSE 0 END)::int AS gemini_digital_tampering,
          SUM(CASE WHEN (fraud_signals->>'geminiAiGenerated')::boolean THEN 1 ELSE 0 END)::int AS gemini_ai_generated,
          SUM(CASE WHEN (fraud_signals->>'geminiNotADocument')::boolean THEN 1 ELSE 0 END)::int AS gemini_not_a_document,
          SUM(CASE WHEN (fraud_signals->>'geminiInconsistentData')::boolean THEN 1 ELSE 0 END)::int AS gemini_inconsistent_data
        FROM expenses
        WHERE fraud_signals IS NOT NULL
      `),
      db.rawQuery<{ rows: { day: string; total: number }[] }>(`
        SELECT TO_CHAR(DATE(created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, COUNT(*)::int AS total
        FROM expenses
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY day
      `),
    ])

    const fraudRow = fraudSignalsResult.rows[0] ?? {}

    return response.ok({
      pending: Number(pending?.$extras.total ?? 0),
      manualReview: Number(manualReview?.$extras.total ?? 0),
      approvedToday: Number(approvedToday?.$extras.total ?? 0),
      rejectedToday: Number(rejectedToday?.$extras.total ?? 0),
      statusDistribution: statusDistResult.rows,
      expensesByUser: expensesByUserResult.rows,
      fraudSignalCounts: [
        { signal: 'Valor acima do limite', total: fraudRow.amount_exceeds_category_limit ?? 0 },
        { signal: 'Adulteração digital', total: fraudRow.gemini_digital_tampering ?? 0 },
        { signal: 'Gerado por IA', total: fraudRow.gemini_ai_generated ?? 0 },
        { signal: 'Não é documento', total: fraudRow.gemini_not_a_document ?? 0 },
        { signal: 'Dados inconsistentes', total: fraudRow.gemini_inconsistent_data ?? 0 },
      ],
      expensesByDay: expensesByDayResult.rows,
    })
  }
}
