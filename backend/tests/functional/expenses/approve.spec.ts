import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { ExpenseFactory } from '#database/factories/expense_factory'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/expenses'

test.group('Expenses / Approve', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const expense = await ExpenseFactory.with('user').create()

    const response = await client.patch(`${BASE_URL}/${expense.id}/approve`)

    response.assertStatus(401)
    response.assertBodyContains({ errors: [{ message: 'Unauthorized access' }] })
  })

  test('returns 403 when employee tries to approve', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const expense = await ExpenseFactory.with('user').merge({ status: 'pending' }).create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/approve`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ message: 'Access denied' }] })
  })

  test('returns 200 when hr approves a pending expense', async ({ client }) => {
    const { user: hr, token } = await loginAs(client, 'hr')
    const expense = await ExpenseFactory.with('user').merge({ status: 'pending' }).create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/approve`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      id: expense.id,
      userId: expense.userId,
      originalFilename: expense.originalFilename,
      status: 'approved',
      approvedBy: hr.id,
    })
    response.assert!.isNotNull(response.body().approvedAt)
  })

  test('returns 200 when hr approves a manual_review expense', async ({ client }) => {
    const { user: hr, token } = await loginAs(client, 'hr')
    const expense = await ExpenseFactory.with('user').merge({ status: 'manual_review' }).create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/approve`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      id: expense.id,
      status: 'approved',
      approvedBy: hr.id,
    })
    response.assert!.isNotNull(response.body().approvedAt)
  })

  test('returns 422 when expense is not in an approvable status', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const expense = await ExpenseFactory.with('user').merge({ status: 'approved' }).create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/approve`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(422)
    response.assertBodyContains({ message: 'Only pending or under review expenses can be approved' })
  })

  test('returns 404 when expense does not exist', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .patch(`${BASE_URL}/non-existent-id/approve`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })
})
