import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import drive from '@adonisjs/drive/services/main'
import queue from '@rlanz/bull-queue/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { ulid } from 'ulidx'
import Expense from '#models/expense'
import ExpensePolicy from '#policies/expense_policy'
import ProcessExpenseJob from '#jobs/process_expense_job'
import { storeExpenseValidator, rejectExpenseValidator } from '#validators/expense_validator'

export default class ExpensesController {
  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    const query = Expense.query()
      .preload('selectedCategory')
      .preload('user', (q) => q.select(['id', 'fullName', 'email']))
      .orderBy('created_at', 'desc')

    if (user.role === 'employee') {
      query.where('user_id', user.id)
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
}
