import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ExpenseFactory } from '#database/factories/expense_factory'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/expenses'

test.group('Expenses / Show', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const expense = await ExpenseFactory.with('user').create()

    const response = await client.get(`${BASE_URL}/${expense.id}`)

    response.assertStatus(401)
    response.assertBodyContains({ errors: [{ message: 'Unauthorized access' }] })
  })

  test('employee can view their own expense with fileUrl', async ({ client }) => {
    const { user: employee, token } = await loginAs(client, 'employee')
    const expense = await ExpenseFactory.merge({ userId: employee.id }).create()

    const response = await client
      .get(`${BASE_URL}/${expense.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      id: expense.id,
      userId: employee.id,
      originalFilename: expense.originalFilename,
      status: expense.status,
      selectedCategoryId: expense.selectedCategoryId,
      rejectionReason: null,
      approvedBy: null,
    })
    const { fileUrl } = response.body()
    response.assert!.isString(fileUrl)
    response.assert!.include(fileUrl, 'signature=')
  })

  test('returns 403 when employee tries to view another employee expense', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const otherUser = await UserFactory.create()
    const expense = await ExpenseFactory.merge({ userId: otherUser.id }).create()

    const response = await client
      .get(`${BASE_URL}/${expense.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ message: 'Access denied' }] })
  })

  test('hr can view any expense', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const user = await UserFactory.create()
    const expense = await ExpenseFactory.merge({ userId: user.id }).create()

    const response = await client
      .get(`${BASE_URL}/${expense.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      id: expense.id,
      userId: user.id,
      originalFilename: expense.originalFilename,
      status: expense.status,
      selectedCategoryId: expense.selectedCategoryId,
      rejectionReason: null,
      approvedBy: null,
    })
    const { fileUrl } = response.body()
    response.assert!.isString(fileUrl)
    response.assert!.include(fileUrl, 'signature=')
  })

  test('returns 404 when expense does not exist', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .get(`${BASE_URL}/non-existent-id`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })
})
