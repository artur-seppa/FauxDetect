import vine from '@vinejs/vine'

export const storeCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    maxAmount: vine.number().positive().optional(),
    active: vine.boolean().optional(),
  })
)

export const updateCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100).optional(),
    maxAmount: vine.number().positive().nullable().optional(),
    active: vine.boolean().optional(),
  })
)
