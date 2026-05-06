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

  test('returns 200 with zero counts and empty arrays when no expenses', async ({ client, assert }) => {
    const { token } = await loginAs(client, 'hr')

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      pending: 0,
      manualReview: 0,
      approvedToday: 0,
      rejectedToday: 0,
    })

    const body = response.body()
    assert.isArray(body.statusDistribution)
    assert.isArray(body.expensesByUser)
    assert.isArray(body.fraudSignalCounts)
    assert.isArray(body.expensesByDay)
    assert.lengthOf(body.fraudSignalCounts, 5)
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

  test('statusDistribution groups all expense statuses with counts', async ({ client, assert }) => {
    const { token } = await loginAs(client, 'hr')
    const user = await UserFactory.create()

    await ExpenseFactory.merge({ userId: user.id, status: 'pending' }).createMany(2)
    await ExpenseFactory.merge({ userId: user.id, status: 'rejected' }).createMany(3)
    await ExpenseFactory.merge({
      userId: user.id,
      status: 'approved',
      approvedAt: DateTime.now(),
    }).create()

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)
    response.assertStatus(200)

    const dist = response.body().statusDistribution as { status: string; total: number }[]
    assert.isArray(dist)

    const pending = dist.find((d) => d.status === 'pending')
    const rejected = dist.find((d) => d.status === 'rejected')
    const approved = dist.find((d) => d.status === 'approved')

    assert.equal(pending?.total, 2)
    assert.equal(rejected?.total, 3)
    assert.equal(approved?.total, 1)
  })

  test('expensesByUser returns expense count per user sorted descending', async ({ client, assert }) => {
    const { token } = await loginAs(client, 'hr')
    const userA = await UserFactory.create()
    const userB = await UserFactory.create()

    await ExpenseFactory.merge({ userId: userA.id }).createMany(3)
    await ExpenseFactory.merge({ userId: userB.id }).createMany(1)

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)
    response.assertStatus(200)

    const byUser = response.body().expensesByUser as { name: string; total: number }[]
    assert.isArray(byUser)

    const entryA = byUser.find((u) => u.name === userA.fullName)
    const entryB = byUser.find((u) => u.name === userB.fullName)

    assert.equal(entryA?.total, 3)
    assert.equal(entryB?.total, 1)
    assert.isAbove(byUser.indexOf(entryA!), -1)
    assert.isBelow(byUser.indexOf(entryA!), byUser.indexOf(entryB!))
  })

  test('fraudSignalCounts aggregates each fraud signal flag across expenses', async ({ client, assert }) => {
    const { token } = await loginAs(client, 'hr')
    const user = await UserFactory.create()

    const baseSignals = {
      amountExceedsCategoryLimit: false,
      geminiDigitalTampering: false,
      geminiAiGenerated: false,
      geminiNotADocument: false,
      geminiInconsistentData: false,
    }

    await ExpenseFactory.merge({
      userId: user.id,
      fraudSignals: { ...baseSignals, amountExceedsCategoryLimit: true, geminiAiGenerated: true },
    }).createMany(2)

    await ExpenseFactory.merge({
      userId: user.id,
      fraudSignals: { ...baseSignals, geminiDigitalTampering: true },
    }).create()

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)
    response.assertStatus(200)

    const counts = response.body().fraudSignalCounts as { signal: string; total: number }[]
    assert.isArray(counts)
    assert.lengthOf(counts, 5)

    const amountEntry = counts.find((s) => s.signal === 'Valor acima do limite')
    const tamperingEntry = counts.find((s) => s.signal === 'Adulteração digital')
    const aiEntry = counts.find((s) => s.signal === 'Gerado por IA')
    const notDocEntry = counts.find((s) => s.signal === 'Não é documento')
    const inconsistentEntry = counts.find((s) => s.signal === 'Dados inconsistentes')

    assert.equal(amountEntry?.total, 2)
    assert.equal(tamperingEntry?.total, 1)
    assert.equal(aiEntry?.total, 2)
    assert.equal(notDocEntry?.total, 0)
    assert.equal(inconsistentEntry?.total, 0)
  })

  test('expensesByDay returns counts for expenses created in the last 30 days', async ({ client, assert }) => {
    const { token } = await loginAs(client, 'hr')
    const user = await UserFactory.create()

    await ExpenseFactory.merge({ userId: user.id }).createMany(3)

    const response = await client.get(BASE_URL).header('Authorization', `Bearer ${token}`)
    response.assertStatus(200)

    const byDay = response.body().expensesByDay as { day: string; total: number }[]
    assert.isArray(byDay)

    const today = DateTime.now().toISODate()
    const todayEntry = byDay.find((d) => d.day === today)
    assert.equal(todayEntry?.total, 3)
  })
})
