import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator } from '#validators/auth_validator'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const existingUser = await User.findBy('email', data.email)
    if (existingUser) {
      return response.conflict({ message: 'Email already in use' })
    }

    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role ?? 'employee',
      department: data.department ?? null,
    })

    const token = await User.accessTokens.create(user)

    return response.created({
      token: token.value!.release(),
      user: user.serialize(),
    })
  }
}
