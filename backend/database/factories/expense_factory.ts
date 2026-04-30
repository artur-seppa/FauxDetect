import factory from '@adonisjs/lucid/factories'
import Expense from '#models/expense'
import { UserFactory } from '#database/factories/user_factory'

export const ExpenseFactory = factory
  .define(Expense, ({ faker }) => {
    return {
      originalFilename: `receipt_${faker.string.alphanumeric(8)}.jpg`,
      filePath: `expenses/${faker.string.alphanumeric(26)}.jpg`,
      fileHash: faker.string.hexadecimal({ length: 64, prefix: '', casing: 'lower' }),
      selectedCategoryId: null,
      employeeDescription: null,
      status: 'pending' as const,
      extractedAmount: null,
      extractedDate: null,
      extractedVendor: null,
      extractedDescription: null,
      fraudSignals: null,
      fraudScore: null,
      fraudDetails: null,
      categoryMatch: null,
      rejectionReason: null,
      approvedBy: null,
      approvedAt: null,
    }
  })
  .relation('user', () => UserFactory)
  .build()
