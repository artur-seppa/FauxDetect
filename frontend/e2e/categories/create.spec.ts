import { test, expect } from '@playwright/test'
import { HR, setAuthCookies } from '../helpers'
import { type MockCategory } from './helpers'

test.describe('create category', () => {
  test('opens drawer on Nova Categoria click', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route('/api/categories', (route) => route.fulfill({ json: [] }))
    await page.goto('/hr/categories')

    await page.getByRole('button', { name: 'Nova Categoria' }).click()
    await expect(page.getByRole('heading', { name: 'Nova Categoria' })).toBeVisible()
    await expect(page.getByLabel('Nome')).toBeVisible()
    await expect(page.getByLabel('Keywords')).toBeVisible()
    await expect(page.getByLabel('Limite (R$)')).toBeVisible()
  })

  test('creates category with keywords and updates table', async ({ page, context }) => {
    await setAuthCookies(context, HR)

    const created: MockCategory = { id: 10, name: 'Parking', maxAmount: 30, active: true, keywords: ['parking', 'valet'] }
    let categories: MockCategory[] = []

    await page.route('/api/categories', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: categories })
      } else {
        categories = [...categories, created]
        await route.fulfill({ status: 201, json: created })
      }
    })

    await page.goto('/hr/categories')
    await page.getByRole('button', { name: 'Nova Categoria' }).click()
    await page.getByLabel('Nome').fill('Parking')
    await page.getByLabel('Keywords').fill('parking, valet')
    await page.getByLabel('Limite (R$)').fill('30')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByRole('cell', { name: 'Parking', exact: true })).toBeVisible()
    await expect(page.getByText('parking', { exact: true })).toBeVisible()
    await expect(page.getByText('valet', { exact: true })).toBeVisible()
  })

  test('shows validation error when name is empty', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route('/api/categories', (route) => route.fulfill({ json: [] }))
    await page.goto('/hr/categories')

    await page.getByRole('button', { name: 'Nova Categoria' }).click()
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Nome obrigatório')).toBeVisible()
  })

  test('closes drawer on Cancelar click', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route('/api/categories', (route) => route.fulfill({ json: [] }))
    await page.goto('/hr/categories')

    await page.getByRole('button', { name: 'Nova Categoria' }).click()
    // scope to the form to avoid matching the confirm-modal's Cancelar button
    await page.locator('form').getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('heading', { name: 'Nova Categoria' })).not.toBeVisible()
  })
})
