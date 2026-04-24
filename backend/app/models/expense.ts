import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Category from '#models/category'

export type ExpenseStatus = 'processing' | 'pending' | 'approved' | 'rejected' | 'manual_review'

export type FraudSignals = {
  imageManipulation: boolean
  onlineDuplicate: boolean
  suspiciousWords: boolean
  confidenceAmount: number
  confidenceVendor: number
}

export default class Expense extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  // File
  @column()
  declare originalFilename: string

  @column()
  declare filePath: string

  @column()
  declare fileHash: string

  // Employee input
  @column()
  declare selectedCategoryId: number | null

  @column()
  declare employeeDescription: string | null

  // Extracted by Google Document AI
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

  @column()
  declare categoryMatch: boolean | null

  // Workflow
  @column()
  declare status: ExpenseStatus

  @column()
  declare rejectionReason: string | null

  @column()
  declare approvedBy: number | null

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
