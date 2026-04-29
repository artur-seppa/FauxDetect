import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

const LOGIN_URL = '/api/auth/login'
const LOGOUT_URL = '/api/auth/logout'
const DEFAULT_PASSWORD = 'Test@12345'

test.group('Auth / Logout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 200 with message and invalidates token', async ({ client }) => {
    const user = await UserFactory.merge({ password: DEFAULT_PASSWORD }).create()

    const loginResponse = await client.post(LOGIN_URL).json({
      email: user.email,
      password: DEFAULT_PASSWORD,
    })

    const { token } = loginResponse.body()

    const response = await client
      .delete(LOGOUT_URL)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Logged out successfully' })
  })

  test('returns 401 without authorization header', async ({ client }) => {
    const response = await client.delete(LOGOUT_URL)

    response.assertStatus(401)
    response.assertBodyContains({ errors: [{ message: 'Unauthorized access' }] })
  })

  test('returns 401 with invalid token', async ({ client }) => {
    const response = await client
      .delete(LOGOUT_URL)
      .header('Authorization', 'Bearer invalid.token.here')

    response.assertStatus(401)
    response.assertBodyContains({ errors: [{ message: 'Unauthorized access' }] })
  })
})
