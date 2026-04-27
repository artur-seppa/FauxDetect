import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().toLowerCase(),
    password: vine.string(),
  })
)

export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100),
    email: vine.string().email().toLowerCase(),
    password: vine.string().minLength(8),
    role: vine.enum(['employee', 'hr', 'admin'] as const).optional(),
    department: vine
      .enum(['engineering', 'human resources', 'finance', 'marketing', 'operations', 'sales'] as const)
      .optional(),
  })
)
