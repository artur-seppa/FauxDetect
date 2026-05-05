import { test, expect } from '@playwright/test'
import { HR, setAuthCookies } from '../helpers'
import { HR_EXPENSES } from './helpers'

test.describe('hr expense listing', () => {
  test.beforeEach(async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route(/\/api\/expenses(\?.*)?$/, (route) => route.fulfill({ json: HR_EXPENSES }))
    await page.goto('/hr/expenses')
  })

  test('renders page heading and Exportar CSV link', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Despesas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Exportar CSV' })).toBeVisible()
  })

  test('renders all status filter tabs', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Todos' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pendente' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Revisão Manual' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Aprovado' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Rejeitado' })).toBeVisible()
  })

  test('renders employee names in table', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'John Employee' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Jane Smith' }).first()).toBeVisible()
  })

  test('renders expense filenames', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'nota-fiscal.png' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'recibo-suspeito.pdf' })).toBeVisible()
  })

  test('renders status badges for each expense', async ({ page }) => {
    await expect(page.getByText('Pendente')).toBeVisible()
    await expect(page.getByText('Rejeitado')).toBeVisible()
    await expect(page.getByText('Revisão Manual')).toBeVisible()
  })

  test('renders fraud score with green color for low score', async ({ page }) => {
    const greenScore = page.locator('td').filter({ hasText: /^0$/ }).locator('span')
    await expect(greenScore.first()).toHaveClass(/text-green-600/)
  })

  test('renders fraud score with yellow color for medium score', async ({ page }) => {
    const yellowScore = page.locator('td').filter({ hasText: /^45$/ }).locator('span')
    await expect(yellowScore).toHaveClass(/text-yellow-600/)
  })

  test('renders Revisar links for each row', async ({ page }) => {
    const links = page.getByRole('link', { name: 'Revisar' })
    await expect(links.first()).toBeVisible()
    await expect(links).toHaveCount(HR_EXPENSES.length)
  })

  test('Revisar link points to correct hr expense detail page', async ({ page }) => {
    const firstLink = page.getByRole('link', { name: 'Revisar' }).first()
    await expect(firstLink).toHaveAttribute('href', `/hr/expenses/${HR_EXPENSES[0].id}`)
  })

  test('clicking Pendente tab updates URL', async ({ page }) => {
    await page.getByRole('link', { name: 'Pendente' }).click()
    await expect(page).toHaveURL('/hr/expenses?status=pending')
  })

  test('clicking Aprovado tab updates URL', async ({ page }) => {
    await page.getByRole('link', { name: 'Aprovado' }).click()
    await expect(page).toHaveURL('/hr/expenses?status=approved')
  })

  test('Todos tab is highlighted by default', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Todos' })).toHaveClass(/bg-blue-600/)
  })
})

test.describe('hr listing — empty state', () => {
  test('shows empty message when no expenses exist', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route(/\/api\/expenses(\?.*)?$/, (route) => route.fulfill({ json: [] }))
    await page.goto('/hr/expenses')
    await expect(page.getByText('Nenhuma despesa encontrada.')).toBeVisible()
  })
})
