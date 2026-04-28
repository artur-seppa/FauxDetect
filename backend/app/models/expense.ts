import { DateTime } from 'luxon'
import { column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import AppBaseModel from '#models/base_model'
import User from '#models/user'
import Category from '#models/category'

export type ExpenseStatus = 'processing' | 'pending' | 'approved' | 'rejected' | 'manual_review'

export type FraudSignals = {
  duplicateFile: boolean
  lowOcrConfidence: boolean
  suspiciousWords: boolean
  amountExceedsCategoryLimit: boolean
}

export default class Expense extends AppBaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  // File
  @column()
  declare originalFilename: string

  @column()
  declare filePath: string

  @column()
  declare fileHash: string

  // Employee input
  @column()
  declare selectedCategoryId: string | null

  @column()
  declare employeeDescription: string | null

  // Extracted by OCR
  @column()
  declare extractedAmount: number | null

  @column.date()
  declare extractedDate: DateTime | null

  @column()
  declare extractedVendor: string | null

  @column()
  declare extractedDescription: string | null

  // Fraud analysis
  @column()
  declare fraudSignals: FraudSignals | null

  @column()
  declare fraudScore: number | null

  @column()
  declare fraudDetails: string | null

  // Workflow
  @column()
  declare status: ExpenseStatus

  @column()
  declare rejectionReason: string | null

  @column()
  declare approvedBy: string | null

  @column.dateTime()
  declare approvedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Category, { foreignKey: 'selectedCategoryId' })
  declare selectedCategory: BelongsTo<typeof Category>

  @belongsTo(() => User, { foreignKey: 'approvedBy' })
  declare approver: BelongsTo<typeof User>
}
