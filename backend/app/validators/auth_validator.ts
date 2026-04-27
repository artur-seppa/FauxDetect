import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100),
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8),
    role: vine.enum(['employee', 'hr', 'admin'] as const).optional(),
    department: vine.string().trim().optional(),
  })
)
