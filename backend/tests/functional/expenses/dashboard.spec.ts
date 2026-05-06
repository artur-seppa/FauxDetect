import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { ExpenseFactory } from '#database/factories/expense_factory'
import { UserFactory } from '#database/factories/user_factory'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/expenses/dashboard'

test.group('Expenses / Dashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const response = await client.get(BASE_URL)

    response.assertStatus(401)
    response.assertBodyContains({ errors: [{ message: 'Unauthorized access' }] })
  })

  test('returns 200 with all zero counts when no expenses', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      pending: 0,
      manualReview: 0,
      approvedToday: 0,
      rejectedToday: 0,
    })
  })

  test('counts pending and manual_review expenses correctly', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const user = await UserFactory.create()

    await ExpenseFactory.merge({ userId: user.id, status: 'pending' }).createMany(2)
    await ExpenseFactory.merge({ userId: user.id, status: 'manual_review' }).create()
    await ExpenseFactory.merge({ userId: user.id, status: 'approved' }).create()

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ pending: 2, manualReview: 1 })
  })

  test('counts approved today using approvedAt date', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const user = await UserFactory.create()
    const today = DateTime.now()
    const yesterday = today.minus({ days: 1 })

    await ExpenseFactory.merge({
      userId: user.id,
      status: 'approved',
      approvedAt: today,
    }).create()
    await ExpenseFactory.merge({
      userId: user.id,
      status: 'approved',
      approvedAt: yesterday,
    }).create()

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ approvedToday: 1 })
  })

  test('counts rejected today using updatedAt date', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const user = await UserFactory.create()

    await ExpenseFactory.merge({ userId: user.id, status: 'rejected' }).createMany(3)

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ rejectedToday: 3 })
  })
})
