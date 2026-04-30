import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ExpenseFactory } from '#database/factories/expense_factory'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/expenses'

test.group('Expenses / Index', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const response = await client.get(BASE_URL)

    response.assertStatus(401)
    response.assertBodyContains({ errors: [{ message: 'Unauthorized access' }] })
  })

  test('returns 200 with empty array when no expenses', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = response.body()
    response.assert!.isArray(body)
    response.assert!.lengthOf(body, 0)
  })

  test('employee sees only their own expenses', async ({ client }) => {
    const { user: employee, token } = await loginAs(client, 'employee')
    const otherUser = await UserFactory.create()
    const expense = await ExpenseFactory.merge({ userId: employee.id }).create()
    await ExpenseFactory.merge({ userId: otherUser.id }).create()

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = response.body()
    response.assert!.lengthOf(body, 1)
    response.assertBodyContains([
      {
        id: expense.id,
        userId: employee.id,
        originalFilename: expense.originalFilename,
        status: expense.status,
      },
    ])
  })

  test('hr sees all expenses', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const user1 = await UserFactory.create()
    const user2 = await UserFactory.create()
    await ExpenseFactory.merge({ userId: user1.id }).create()
    await ExpenseFactory.merge({ userId: user2.id }).create()

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = response.body()
    response.assert!.lengthOf(body, 2)
    const userIds = body.map((e: any) => e.userId)
    response.assert!.includeMembers(userIds, [user1.id, user2.id])
  })
})
