import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { CategoryFactory } from '#database/factories/category_factory'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/categories'

test.group('Categories / Index', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const response = await client.get(BASE_URL)

    response.assertStatus(401)
  })

  test('returns 200 with list of categories for any authenticated user', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
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
    const { token } = await loginAs(client, 'employee')
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
