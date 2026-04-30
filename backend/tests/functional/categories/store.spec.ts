import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { CategoryFactory } from '#database/factories/category_factory'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/categories'

test.group('Categories / Store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const response = await client.post(BASE_URL).json({ name: 'Meals' })

    response.assertStatus(401)
  })

  test('returns 403 when user is employee', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Meals' })

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ message: 'Access denied' }] })
  })

  test('returns 201 with created category when user is hr', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Meals', maxAmount: 50 })

    response.assertStatus(201)
    const body = response.body()
    response.assert!.isString(body.id)
    response.assert!.isNotEmpty(body.id)
    response.assertBodyContains({ name: 'Meals', active: true, keywords: [] })
  })

  test('returns 201 with keywords when provided', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Lunch', keywords: ['restaurant', 'food', 'ifood'] })

    response.assertStatus(201)
    const body = response.body()
    response.assert!.sameMembers(body.keywords, ['restaurant', 'food', 'ifood'])
  })

  test('returns 201 with created category when user is admin', async ({ client }) => {
    const { token } = await loginAs(client, 'admin')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Parking' })

    response.assertStatus(201)
    const body = response.body()
    response.assert!.isString(body.id)
    response.assert!.isNotEmpty(body.id)
    response.assertBodyContains({ name: 'Parking', maxAmount: null, active: true, keywords: [] })
  })

  test('returns 201 with active defaulting to true when not provided', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Hotel' })

    response.assertStatus(201)
    response.assertBodyContains({ name: 'Hotel', maxAmount: null, active: true, keywords: [] })
  })

  test('returns 409 when category name already exists', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    await CategoryFactory.merge({ name: 'Meals' }).create()

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Meals' })

    response.assertStatus(409)
    response.assertBodyContains({ message: 'Category name already in use' })
  })

  test('returns 422 when name is missing', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({})

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'name' }] })
  })

  test('returns 422 when keywords contains non-string values', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Meals', keywords: [1, 2, 3] })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'keywords.0' }] })
  })
})
