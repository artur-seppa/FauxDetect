import { test, expect } from '@playwright/test'
import { EMPLOYEE, setAuthCookies } from '../helpers'
import { MOCK_CATEGORY, MOCK_PENDING_EXPENSE } from './helpers'

// Backdrop has opacity-100 when drawer is open, opacity-0 when closed
const backdrop = (page: import('@playwright/test').Page) => page.locator('.bg-black\\/30')

test.describe('new expense submission', () => {
  test.beforeEach(async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.route('/api/categories', (route) => route.fulfill({ json: [MOCK_CATEGORY] }))
    await page.route('/api/expenses', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: [] })
      } else {
        await route.fulfill({ status: 201, json: MOCK_PENDING_EXPENSE })
      }
    })
    await page.goto('/dashboard')
  })

  test('opens drawer when Nova Despesa is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    await expect(page.getByRole('heading', { name: 'Nova Despesa' })).toBeVisible()
  })

  test('drawer shows Comprovante, Categoria and Descrição fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    await expect(page.getByText('Comprovante')).toBeVisible()
    await expect(page.getByText('Categoria', { exact: true })).toBeVisible()
    await expect(page.getByText('Descrição')).toBeVisible()
  })

  test('drawer shows categories from API in select', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    const select = page.getByRole('combobox')
    await expect(select).toBeVisible()
    await select.selectOption({ label: 'Almoço' })
    await expect(select).toHaveValue('1')
  })

  test('closes drawer on Escape key', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    await expect(backdrop(page)).toHaveClass(/opacity-100/)
    await page.keyboard.press('Escape')
    await expect(backdrop(page)).toHaveClass(/opacity-0/)
  })

  test('closes drawer when backdrop is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    await expect(backdrop(page)).toHaveClass(/opacity-100/)
    await backdrop(page).click({ force: true })
    await expect(backdrop(page)).toHaveClass(/opacity-0/)
  })

  test('submit button is disabled when no file or category is selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    await expect(page.getByRole('button', { name: 'Enviar Despesa' })).toBeDisabled()
  })

  test('submit button is disabled when only file is selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    await page.locator('input[type="file"]').setInputFiles({
      name: 'nota-fiscal.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(100),
    })
    await expect(page.getByRole('button', { name: 'Enviar Despesa' })).toBeDisabled()
  })

  test('submits expense and closes drawer on success', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    await page.locator('input[type="file"]').setInputFiles({
      name: 'nota-fiscal.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(100),
    })
    await page.getByRole('combobox').selectOption({ label: 'Almoço' })
    await page.getByRole('button', { name: 'Enviar Despesa' }).click()
    await expect(backdrop(page)).toHaveClass(/opacity-0/)
  })

  test('description character counter updates as user types', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    await page.getByPlaceholder('Ex.: almoço com cliente da empresa X').fill('teste')
    await expect(page.getByText('5/500')).toBeVisible()
  })

  test('shows error message when submission fails', async ({ page }) => {
    await page.route('/api/expenses', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: [] })
      } else {
        await route.fulfill({ status: 422, json: { message: 'Arquivo inválido.' } })
      }
    })
    await page.getByRole('button', { name: 'Nova Despesa' }).click()
    await page.locator('input[type="file"]').setInputFiles({
      name: 'nota-fiscal.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(100),
    })
    await page.getByRole('combobox').selectOption({ label: 'Almoço' })
    await page.getByRole('button', { name: 'Enviar Despesa' }).click()
    await expect(page.getByText('Arquivo inválido.')).toBeVisible()
  })
})
