import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { ExpenseFactory } from '#database/factories/expense_factory'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/expenses'

test.group('Expenses / Reject', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when unauthenticated', async ({ client }) => {
    const expense = await ExpenseFactory.with('user').create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/reject`)
      .json({ rejectionReason: 'Invalid receipt' })

    response.assertStatus(401)
    response.assertBodyContains({ errors: [{ message: 'Unauthorized access' }] })
  })

  test('returns 403 when employee tries to reject', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const expense = await ExpenseFactory.with('user').merge({ status: 'pending' }).create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/reject`)
      .header('Authorization', `Bearer ${token}`)
      .json({ rejectionReason: 'Invalid' })

    response.assertStatus(403)
    response.assertBodyContains({ errors: [{ message: 'Access denied' }] })
  })

  test('returns 422 when rejectionReason is missing', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const expense = await ExpenseFactory.with('user').merge({ status: 'pending' }).create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/reject`)
      .header('Authorization', `Bearer ${token}`)
      .json({})

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'rejectionReason' }] })
  })

  test('returns 200 when hr rejects a pending expense', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const expense = await ExpenseFactory.with('user').merge({ status: 'pending' }).create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/reject`)
      .header('Authorization', `Bearer ${token}`)
      .json({ rejectionReason: 'Receipt is not valid' })

    response.assertStatus(200)
    response.assertBodyContains({
      id: expense.id,
      userId: expense.userId,
      originalFilename: expense.originalFilename,
      status: 'rejected',
      rejectionReason: 'Receipt is not valid',
    })
  })

  test('returns 200 when hr rejects a manual_review expense', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const expense = await ExpenseFactory.with('user').merge({ status: 'manual_review' }).create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/reject`)
      .header('Authorization', `Bearer ${token}`)
      .json({ rejectionReason: 'Fraud detected' })

    response.assertStatus(200)
    response.assertBodyContains({
      id: expense.id,
      status: 'rejected',
      rejectionReason: 'Fraud detected',
    })
  })

  test('returns 422 when expense is not in a rejectable status', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')
    const expense = await ExpenseFactory.with('user').merge({ status: 'approved' }).create()

    const response = await client
      .patch(`${BASE_URL}/${expense.id}/reject`)
      .header('Authorization', `Bearer ${token}`)
      .json({ rejectionReason: 'Changed my mind' })

    response.assertStatus(422)
    response.assertBodyContains({ message: 'Only pending or under review expenses can be rejected' })
  })

  test('returns 404 when expense does not exist', async ({ client }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client
      .patch(`${BASE_URL}/non-existent-id/reject`)
      .header('Authorization', `Bearer ${token}`)
      .json({ rejectionReason: 'Does not exist' })

    response.assertStatus(404)
  })
})
