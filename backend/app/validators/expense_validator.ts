import vine from '@vinejs/vine'

export const storeExpenseValidator = vine.compile(
  vine.object({
    receipt: vine.file({
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'pdf'],
    }),
    selectedCategoryId: vine.string(),
    employeeDescription: vine.string().trim().maxLength(500).nullable().optional(),
  })
)

export const rejectExpenseValidator = vine.compile(
  vine.object({
    rejectionReason: vine.string().trim().minLength(1).maxLength(500),
  })
)
