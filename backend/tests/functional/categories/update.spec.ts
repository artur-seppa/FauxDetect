import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { CategoryFactory } from '#database/factories/category_factory'
import CategoryKeyword from '#models/category_keyword'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/categories'

test.group('Categories / Update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const category = await CategoryFactory.create()

    const response = await client.patch(`${BASE_URL}/${category.id}`).json({ name: 'Updated' })

    response.assertStatus(401)
  })

  test('returns 403 when user is employee', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const category = await CategoryFactory.create()

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Updated' })

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ message: 'Access denied' }] })
  })

  test('returns 200 with updated category when user is hr', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const category = await CategoryFactory.merge({ name: 'Old Name' }).create()

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'New Name', maxAmount: 100 })

    response.assertStatus(200)
    response.assertBodyContains({ id: category.id, name: 'New Name', keywords: [] })
  })

  test('returns 200 updating only the provided fields', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const category = await CategoryFactory.merge({ name: 'Meals', maxAmount: 50, active: true }).create()

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ active: false })

    response.assertStatus(200)
    response.assertBodyContains({ id: category.id, name: 'Meals', active: false })
  })

  test('sets keywords when provided on update', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const category = await CategoryFactory.merge({ name: 'Lunch' }).create()

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ keywords: ['restaurant', 'food'] })

    response.assertStatus(200)
    const body = response.body()
    response.assert!.sameMembers(body.keywords, ['restaurant', 'food'])
  })

  test('replaces existing keywords when a new list is provided', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const category = await CategoryFactory.merge({ name: 'Lunch' }).create()
    await CategoryKeyword.createMany([
      { categoryId: category.id, name: 'old-keyword-1' },
      { categoryId: category.id, name: 'old-keyword-2' },
    ])

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ keywords: ['restaurant', 'food'] })

    response.assertStatus(200)
    const body = response.body()
    response.assert!.sameMembers(body.keywords, ['restaurant', 'food'])
  })

  test('clears all keywords when empty array is provided', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const category = await CategoryFactory.merge({ name: 'Lunch' }).create()
    await CategoryKeyword.createMany([
      { categoryId: category.id, name: 'restaurant' },
      { categoryId: category.id, name: 'food' },
    ])

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ keywords: [] })

    response.assertStatus(200)
    response.assertBodyContains({ keywords: [] })
  })

  test('does not change keywords when keywords field is omitted', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const category = await CategoryFactory.merge({ name: 'Lunch' }).create()
    await CategoryKeyword.createMany([
      { categoryId: category.id, name: 'restaurant' },
      { categoryId: category.id, name: 'food' },
    ])

    const response = await client
      .patch(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ active: false })

    response.assertStatus(200)
    const body = response.body()
    response.assert!.sameMembers(body.keywords, ['restaurant', 'food'])
  })

  test('returns 409 when updated name conflicts with another category', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
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
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .patch(`${BASE_URL}/non-existent-id`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Updated' })

    response.assertStatus(404)
  })
})
