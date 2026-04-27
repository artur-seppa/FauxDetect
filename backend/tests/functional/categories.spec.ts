import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { CategoryFactory } from '#database/factories/category_factory'

const BASE_URL = '/api/categories'
const LOGIN_URL = '/api/auth/login'
const DEFAULT_PASSWORD = 'Test@12345'

async function loginAs(client: any, role: 'employee' | 'hr' | 'admin') {
  const user = await UserFactory.merge({ role, password: DEFAULT_PASSWORD }).create()
  const res = await client.post(LOGIN_URL).json({ email: user.email, password: DEFAULT_PASSWORD })
  return res.body().token as string
}

test.group('Categories / Index', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const response = await client.get(BASE_URL)

    response.assertStatus(401)
  })

  test('returns 200 with list of categories for any authenticated user', async ({ client }) => {
    const token = await loginAs(client, 'employee')
    await CategoryFactory.merge({ name: 'Meals', maxAmount: 50, active: true }).create()
    await CategoryFactory.merge({ name: 'Uber', maxAmount: null, active: false }).create()

    const response = await client
      .get(BASE_URL)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = response.body()
    response.assert!.isArray(body)
    response.assert!.lengthOf(body, 2)
    response.assert!.properties(body[0], ['id', 'name', 'maxAmount', 'active', 'createdAt', 'updatedAt'])
    response.assertBodyContains([
      { name: 'Meals', active: true },
      { name: 'Uber', maxAmount: null, active: false },
    ])
  })

  test('returns categories ordered by name', async ({ client }) => {
    const token = await loginAs(client, 'employee')
    await CategoryFactory.merge({ name: 'Zebra' }).create()
    await CategoryFactory.merge({ name: 'Alpha' }).create()

    const response = await client
      .get(BASE_URL)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const [first, second] = response.body()
    response.assert!.equal(first.name, 'Alpha')
    response.assert!.equal(second.name, 'Zebra')
  })
})

test.group('Categories / Store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const response = await client.post(BASE_URL).json({ name: 'Meals' })

    response.assertStatus(401)
  })

  test('returns 403 when user is employee', async ({ client }) => {
    const token = await loginAs(client, 'employee')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Meals' })

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ message: 'Access denied' }] })
  })

  test('returns 201 with created category when user is hr', async ({ client }) => {
    const token = await loginAs(client, 'hr')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Meals', maxAmount: 50 })

    response.assertStatus(201)
    const body = response.body()
    response.assert!.isString(body.id)
    response.assert!.isNotEmpty(body.id)
    response.assertBodyContains({ name: 'Meals', active: true })
  })

  test('returns 201 with created category when user is admin', async ({ client }) => {
    const token = await loginAs(client, 'admin')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Parking' })

    response.assertStatus(201)
    const body = response.body()
    response.assert!.isString(body.id)
    response.assert!.isNotEmpty(body.id)
    response.assertBodyContains({ name: 'Parking', maxAmount: null, active: true })
  })

  test('returns 201 with active defaulting to true when not provided', async ({ client }) => {
    const token = await loginAs(client, 'hr')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Hotel' })

    response.assertStatus(201)
    response.assertBodyContains({ name: 'Hotel', maxAmount: null, active: true })
  })

  test('returns 409 when category name already exists', async ({ client }) => {
    const token = await loginAs(client, 'hr')
    await CategoryFactory.merge({ name: 'Meals' }).create()

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Meals' })

    response.assertStatus(409)
    response.assertBodyContains({ message: 'Category name already in use' })
  })

  test('returns 422 when name is missing', async ({ client }) => {
    const token = await loginAs(client, 'hr')

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .json({})

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'name' }] })
  })
})

test.group('Categories / Update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const category = await CategoryFactory.create()

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .json({ name: 'Updated' })

    response.assertStatus(401)
  })

  test('returns 403 when user is employee', async ({ client }) => {
    const token = await loginAs(client, 'employee')
    const category = await CategoryFactory.create()

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Updated' })

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ message: 'Access denied' }] })
  })

  test('returns 200 with updated category when user is hr', async ({ client }) => {
    const token = await loginAs(client, 'hr')
    const category = await CategoryFactory.merge({ name: 'Old Name' }).create()

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'New Name', maxAmount: 100 })

    response.assertStatus(200)
    response.assertBodyContains({ id: category.id, name: 'New Name' })
  })

  test('returns 200 updating only the provided fields', async ({ client }) => {
    const token = await loginAs(client, 'hr')
    const category = await CategoryFactory.merge({ name: 'Meals', maxAmount: 50, active: true }).create()

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ active: false })

    response.assertStatus(200)
    response.assertBodyContains({ id: category.id, name: 'Meals', active: false })
  })

  test('returns 409 when updated name conflicts with another category', async ({ client }) => {
    const token = await loginAs(client, 'hr')
    await CategoryFactory.merge({ name: 'Existing' }).create()
    const category = await CategoryFactory.merge({ name: 'Original' }).create()

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Existing' })

    response.assertStatus(409)
    response.assertBodyContains({ message: 'Category name already in use' })
  })

  test('returns 404 when category does not exist', async ({ client }) => {
    const token = await loginAs(client, 'hr')

    const response = await client
      .patch(`${BASE_URL}/non-existent-id`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Updated' })

    response.assertStatus(404)
  })
})

test.group('Categories / Destroy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const category = await CategoryFactory.create()

    const response = await client.delete(`${BASE_URL}/${category.id}`)

    response.assertStatus(401)
  })

  test('returns 403 when user is employee', async ({ client }) => {
    const token = await loginAs(client, 'employee')
    const category = await CategoryFactory.create()

    const response = await client
      .delete(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ message: 'Access denied' }] })
  })

  test('returns 200 with message when user is hr', async ({ client }) => {
    const token = await loginAs(client, 'hr')
    const category = await CategoryFactory.create()

    const response = await client
      .delete(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Category deleted successfully' })
  })

  test('returns 200 with message when user is admin', async ({ client }) => {
    const token = await loginAs(client, 'admin')
    const category = await CategoryFactory.create()

    const response = await client
      .delete(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Category deleted successfully' })
  })

  test('returns 404 when category does not exist', async ({ client }) => {
    const token = await loginAs(client, 'hr')

    const response = await client
      .delete(`${BASE_URL}/non-existent-id`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })
})
