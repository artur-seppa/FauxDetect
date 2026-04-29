import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

const REGISTER_URL = '/api/auth/register'
const DEFAULT_PASSWORD = 'Test@12345'

test.group('Auth / Register', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 201 with token and user on valid payload', async ({ client }) => {
    const response = await client.post(REGISTER_URL).json({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: DEFAULT_PASSWORD,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      user: { email: 'john@example.com', role: 'employee' },
    })

    const { token } = response.body()
    response.assert!.isString(token)
    response.assert!.isNotEmpty(token)
  })

  test('returns 201 with explicit role and department', async ({ client }) => {
    const response = await client.post(REGISTER_URL).json({
      fullName: 'HR Admin',
      email: 'hr@example.com',
      password: DEFAULT_PASSWORD,
      role: 'hr',
      department: 'human resources',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      user: { email: 'hr@example.com', role: 'hr' },
    })

    const { token } = response.body()
    response.assert!.isString(token)
    response.assert!.isNotEmpty(token)
  })

  test('returns 409 when email is already registered', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.post(REGISTER_URL).json({
      fullName: 'Another Person',
      email: user.email,
      password: DEFAULT_PASSWORD,
    })

    response.assertStatus(409)
    response.assertBodyContains({ message: 'Email already in use' })
  })

  test('returns 422 when required fields are missing', async ({ client }) => {
    const response = await client.post(REGISTER_URL).json({})

    response.assertStatus(422)
    const { errors } = response.body()
    response.assert!.isArray(errors)
    response.assert!.isNotEmpty(errors)
  })

  test('returns 422 with invalid email format', async ({ client }) => {
    const response = await client.post(REGISTER_URL).json({
      fullName: 'John Doe',
      email: 'not-an-email',
      password: DEFAULT_PASSWORD,
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'email' }] })
  })

  test('returns 422 when password has fewer than 8 characters', async ({ client }) => {
    const response = await client.post(REGISTER_URL).json({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'short',
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'password' }] })
  })

  test('returns 422 with invalid role value', async ({ client }) => {
    const response = await client.post(REGISTER_URL).json({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: DEFAULT_PASSWORD,
      role: 'superuser',
    })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'role' }] })
  })
})
