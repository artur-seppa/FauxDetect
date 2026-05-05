import { test, expect } from '@playwright/test'
import { EMPLOYEE, setAuthCookies } from '../helpers'
import { MOCK_PENDING_EXPENSE, MOCK_REJECTED_EXPENSE } from './helpers'

test.describe('employee expense listing', () => {
  test.beforeEach(async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.route('/api/expenses', (route) =>
      route.fulfill({ json: [MOCK_PENDING_EXPENSE, MOCK_REJECTED_EXPENSE] })
    )
    await page.goto('/dashboard')
  })

  test('renders page heading and Nova Despesa button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Minhas Despesas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nova Despesa' })).toBeVisible()
  })

  test('renders expense filenames in table', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'nota-fiscal.png' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'recibo-suspeito.pdf' })).toBeVisible()
  })

  test('renders correct status badges', async ({ page }) => {
    await expect(page.getByText('Pendente')).toBeVisible()
    await expect(page.getByText('Rejeitado')).toBeVisible()
  })

  test('renders formatted amount', async ({ page }) => {
    await expect(page.getByText('R$ 45,50')).toBeVisible()
  })

  test('renders Ver links pointing to expense detail pages', async ({ page }) => {
    const links = page.getByRole('link', { name: 'Ver' })
    await expect(links).toHaveCount(2)
    await expect(links.first()).toHaveAttribute('href', `/expenses/${MOCK_PENDING_EXPENSE.id}`)
  })
})

test.describe('employee listing — empty state', () => {
  test('shows empty message when no expenses exist', async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.route('/api/expenses', (route) => route.fulfill({ json: [] }))
    await page.goto('/dashboard')
    await expect(page.getByText('Nenhuma despesa encontrada.')).toBeVisible()
  })
})
