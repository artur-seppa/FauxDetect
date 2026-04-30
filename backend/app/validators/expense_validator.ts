import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

const categoryExists = vine.createRule(async (value: unknown, _, field) => {
  if (typeof value !== 'string') return
  const row = await db.from('categories').where('id', value).where('active', true).first()
  if (!row) {
    field.report('The selected category does not exist or is inactive', 'categoryExists', field)
  }
})

export const storeExpenseValidator = vine.compile(
  vine.object({
    receipt: vine.file({
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'pdf'],
    }),
    selectedCategoryId: vine.string().use(categoryExists()),
    employeeDescription: vine.string().trim().maxLength(500).nullable().optional(),
  })
)

export const rejectExpenseValidator = vine.compile(
  vine.object({
    rejectionReason: vine.string().trim().minLength(1).maxLength(500),
  })
)
