import { createHash } from 'node:crypto'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import fileGenerator from '@poppinss/file-generator'
import drive from '@adonisjs/drive/services/main'
import { CategoryFactory } from '#database/factories/category_factory'
import { ExpenseFactory } from '#database/factories/expense_factory'
import { loginAs } from '#tests/helpers/login_as'

const BASE_URL = '/api/expenses'

test.group('Expenses / Store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  test('returns 401 when unauthenticated', async ({ client }) => {
    const category = await CategoryFactory.create()
    const file = await fileGenerator.generatePng(1)

    const response = await client
      .post(BASE_URL)
      .file('receipt', file.contents, { filename: file.name, contentType: file.mime })
      .field('selectedCategoryId', category.id)

    response.assertStatus(401)
    response.assertBodyContains({ errors: [{ message: 'Unauthorized access' }] })
  })

  test('returns 422 when no file provided', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const category = await CategoryFactory.create()

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .field('selectedCategoryId', category.id)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'receipt' }] })
  })

  test('returns 422 when file has unsupported type', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const category = await CategoryFactory.create()

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .file('receipt', Buffer.from('not-a-valid-file'), { filename: 'malware.exe' })
      .field('selectedCategoryId', category.id)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'receipt' }] })
  })

  test('returns 422 when selectedCategoryId does not exist', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const file = await fileGenerator.generatePng(1)

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .file('receipt', file.contents, { filename: file.name, contentType: file.mime })
      .field('selectedCategoryId', 'non-existent-id')

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'selectedCategoryId' }] })
  })

  test('returns 422 when selectedCategoryId is missing', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const file = await fileGenerator.generatePng(1)

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .file('receipt', file.contents, { filename: file.name, contentType: file.mime })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'selectedCategoryId' }] })
  })

  test('returns 201 with expense in processing status', async ({ client }) => {
    const { user: employee, token } = await loginAs(client, 'employee')
    const category = await CategoryFactory.create()
    const file = await fileGenerator.generatePng(1)

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .file('receipt', file.contents, { filename: file.name, contentType: file.mime })
      .field('selectedCategoryId', category.id)

    response.assertStatus(201)
    response.assert!.isString(response.body().id)
    response.assertBodyContains({
      userId: employee.id,
      originalFilename: file.name,
      selectedCategoryId: category.id,
      status: 'processing',
    })
  })

  test('returns 409 when same file is submitted with an active status', async ({ client }) => {
    const { token } = await loginAs(client, 'employee')
    const category = await CategoryFactory.create()
    const file = await fileGenerator.generatePng(1)

    await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .file('receipt', file.contents, { filename: file.name, contentType: file.mime })
      .field('selectedCategoryId', category.id)

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .file('receipt', file.contents, { filename: file.name, contentType: file.mime })
      .field('selectedCategoryId', category.id)

    response.assertStatus(409)
    response.assertBodyContains({ message: 'This file has already been submitted' })
  })

  test('allows resubmission when previous expense with same file was rejected', async ({ client }) => {
    const { user: employee, token } = await loginAs(client, 'employee')
    const category = await CategoryFactory.create()
    const file = await fileGenerator.generatePng(1)
    const fileHash = createHash('sha256').update(file.contents).digest('hex')

    await ExpenseFactory.merge({ userId: employee.id, fileHash, status: 'rejected' }).create()

    const response = await client
      .post(BASE_URL)
      .header('Authorization', `Bearer ${token}`)
      .file('receipt', file.contents, { filename: file.name, contentType: file.mime })
      .field('selectedCategoryId', category.id)

    response.assertStatus(201)
    response.assertBodyContains({
      userId: employee.id,
      originalFilename: file.name,
      selectedCategoryId: category.id,
      status: 'processing',
    })
  })
})
