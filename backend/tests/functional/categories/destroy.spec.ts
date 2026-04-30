import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { CategoryFactory } from '#database/factories/category_factory'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/categories'

test.group('Categories / Destroy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const category = await CategoryFactory.create()

    const response = await client.delete(`${BASE_URL}/${category.id}`)

    response.assertStatus(401)
  })

  test('returns 403 when user is employee', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const category = await CategoryFactory.create()

    const response = await client
      .delete(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ message: 'Access denied' }] })
  })

  test('returns 200 with message when user is hr', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const category = await CategoryFactory.create()

    const response = await client
      .delete(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Category deleted successfully' })
  })

  test('returns 200 with message when user is admin', async ({ client }) => {
    const { token } = await loginAs(client, 'admin')
    const category = await CategoryFactory.create()

    const response = await client
      .delete(`${BASE_URL}/${category.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Category deleted successfully' })
  })

  test('returns 404 when category does not exist', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .delete(`${BASE_URL}/non-existent-id`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })
})
