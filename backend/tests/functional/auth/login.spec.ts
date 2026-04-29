import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

const LOGIN_URL = '/api/auth/login'
const DEFAULT_PASSWORD = 'Test@12345'

test.group('Auth / Login', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 200 with token and user on valid credentials', async ({ client }) => {
    const user = await UserFactory.merge({ password: DEFAULT_PASSWORD }).create()

    const response = await client.post(LOGIN_URL).json({
      email: user.email,
      password: DEFAULT_PASSWORD,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      user: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
    })

    const { token } = response.body()
    response.assert!.isString(token)
    response.assert!.isNotEmpty(token)
  })

  test('does not expose password in response', async ({ client }) => {
    const user = await UserFactory.merge({ password: DEFAULT_PASSWORD }).create()

    const response = await client.post(LOGIN_URL).json({
      email: user.email,
      password: DEFAULT_PASSWORD,
    })

    response.assertStatus(200)
    const { user: responseUser } = response.body()
    response.assert!.notProperty(responseUser, 'password')
  })

  test('returns 400 with wrong password', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.post(LOGIN_URL).json({
      email: user.email,
      password: 'WrongPassword!',
    })

    response.assertStatus(400)
    response.assertBodyContains({ errors: [{ message: 'Invalid user credentials' }] })
  })

  test('returns 400 with non-existent email', async ({ client }) => {
    const response = await client.post(LOGIN_URL).json({
      email: 'ghost@example.com',
      password: DEFAULT_PASSWORD,
    })

    response.assertStatus(400)
    response.assertBodyContains({ errors: [{ message: 'Invalid user credentials' }] })
  })

  test('returns 422 with invalid email format', async ({ client }) => {
    const response = await client.post(LOGIN_URL).json({
      email: 'not-valid',
      password: DEFAULT_PASSWORD,
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'email' }] })
  })

  test('returns 422 when fields are missing', async ({ client }) => {
    const response = await client.post(LOGIN_URL).json({})

    response.assertStatus(422)
    const { errors } = response.body()
    response.assert!.isArray(errors)
    response.assert!.isNotEmpty(errors)
  })
})
