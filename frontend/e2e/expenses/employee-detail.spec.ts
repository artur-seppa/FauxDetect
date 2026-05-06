import { test, expect } from '@playwright/test'
import { EMPLOYEE, setAuthCookies } from '../helpers'
import { MOCK_PENDING_EXPENSE, MOCK_REJECTED_EXPENSE, MOCK_MANUAL_REVIEW_EXPENSE } from './helpers'

test.describe('employee expense detail', () => {
  test.beforeEach(async ({ context }) => {
    await setAuthCookies(context, EMPLOYEE)
  })

  test('renders filename as heading and status badge', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_PENDING_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_PENDING_EXPENSE })
    )
    await page.goto(`/expenses/${MOCK_PENDING_EXPENSE.id}`)
    await expect(page.getByRole('heading', { name: 'nota-fiscal.png' })).toBeVisible()
    await expect(page.getByText('Pendente')).toBeVisible()
  })

  test('renders Voltar link pointing to /dashboard', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_PENDING_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_PENDING_EXPENSE })
    )
    await page.goto(`/expenses/${MOCK_PENDING_EXPENSE.id}`)
    const voltar = page.getByRole('link', { name: '← Voltar' })
    await expect(voltar).toBeVisible()
    await expect(voltar).toHaveAttribute('href', '/dashboard')
  })

  test('renders extracted data fields', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_PENDING_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_PENDING_EXPENSE })
    )
    await page.goto(`/expenses/${MOCK_PENDING_EXPENSE.id}`)
    await expect(page.getByText('R$ 45,50')).toBeVisible()
    await expect(page.getByText('Restaurante do João')).toBeVisible()
    await expect(page.getByText('Almoço executivo')).toBeVisible()
  })

  test('renders selected category name', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_PENDING_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_PENDING_EXPENSE })
    )
    await page.goto(`/expenses/${MOCK_PENDING_EXPENSE.id}`)
    await expect(page.locator('dt', { hasText: 'Categoria' })).toBeVisible()
    await expect(page.getByText('Almoço', { exact: true })).toBeVisible()
  })

  test('renders fraud signals card', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_PENDING_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_PENDING_EXPENSE })
    )
    await page.goto(`/expenses/${MOCK_PENDING_EXPENSE.id}`)
    await expect(page.getByText('Sinais de Fraude')).toBeVisible()
    await expect(page.getByText('Score: 0/100')).toBeVisible()
  })

  test('renders category match badge when match is true', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_PENDING_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_PENDING_EXPENSE })
    )
    await page.goto(`/expenses/${MOCK_PENDING_EXPENSE.id}`)
    await expect(page.getByText('Corresponde à categoria "Almoço"')).toBeVisible()
  })

  test('renders category no-match badge for manual_review expense', async ({ page }) => {
    const noMatch = { ...MOCK_MANUAL_REVIEW_EXPENSE, categoryMatch: false }
    await page.route(`/api/expenses/${MOCK_MANUAL_REVIEW_EXPENSE.id}`, (route) =>
      route.fulfill({ json: noMatch })
    )
    await page.goto(`/expenses/${MOCK_MANUAL_REVIEW_EXPENSE.id}`)
    await expect(page.getByText('Não corresponde à categoria "Almoço"')).toBeVisible()
  })

  test('shows rejection reason block for rejected expense', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_REJECTED_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_REJECTED_EXPENSE })
    )
    await page.goto(`/expenses/${MOCK_REJECTED_EXPENSE.id}`)
    await expect(page.getByText('Motivo da Rejeição:')).toBeVisible()
    await expect(page.getByText('Comprovante não é válido.')).toBeVisible()
  })

  test('does not show rejection reason for pending expense', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_PENDING_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_PENDING_EXPENSE })
    )
    await page.goto(`/expenses/${MOCK_PENDING_EXPENSE.id}`)
    await expect(page.getByText('Motivo da Rejeição:')).not.toBeVisible()
  })

  test('renders Ver Comprovante link opening in new tab', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_PENDING_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_PENDING_EXPENSE })
    )
    await page.goto(`/expenses/${MOCK_PENDING_EXPENSE.id}`)
    const btn = page.getByRole('link', { name: 'Ver Comprovante' })
    await expect(btn).toBeVisible()
    await expect(btn).toHaveAttribute('target', '_blank')
  })

  test('Voltar link navigates back to dashboard', async ({ page }) => {
    await page.route(`/api/expenses/${MOCK_PENDING_EXPENSE.id}`, (route) =>
      route.fulfill({ json: MOCK_PENDING_EXPENSE })
    )
    await page.route('/api/expenses', (route) => route.fulfill({ json: [] }))
    await page.goto(`/expenses/${MOCK_PENDING_EXPENSE.id}`)
    await page.getByRole('link', { name: '← Voltar' }).click()
    await expect(page).toHaveURL('/dashboard')
  })
})
