import { UserFactory } from '#database/factories/user_factory'

const LOGIN_URL = '/api/auth/login'
const DEFAULT_PASSWORD = 'Test@12345'

export async function loginAs(client: any, role: 'employee' | 'hr' | 'admin') {
  const user = await UserFactory.merge({ role, password: DEFAULT_PASSWORD }).create()
  const res = await client.post(LOGIN_URL).json({ email: user.email, password: DEFAULT_PASSWORD })
  const token = res.body().token as string
  return { user, token }
}
