import { test, expect } from '@playwright/test'
import { HR, setAuthCookies } from '../helpers'

const DASHBOARD_ROUTE = '/api/hr/dashboard'

const MOCK_DASHBOARD = {
  pending: 3,
  manualReview: 1,
  approvedToday: 2,
  rejectedToday: 4,
  statusDistribution: [
    { status: 'pending', total: 3 },
    { status: 'approved', total: 2 },
    { status: 'rejected', total: 4 },
    { status: 'manual_review', total: 1 },
  ],
  expensesByUser: [
    { name: 'John Employee', total: 5 },
    { name: 'Jane Smith', total: 3 },
  ],
  fraudSignalCounts: [
    { signal: 'Valor acima do limite', total: 2 },
    { signal: 'Adulteração digital', total: 1 },
    { signal: 'Gerado por IA', total: 0 },
    { signal: 'Não é documento', total: 3 },
    { signal: 'Dados inconsistentes', total: 1 },
  ],
  expensesByDay: [
    { day: '2026-04-30', total: 2 },
    { day: '2026-05-01', total: 1 },
    { day: '2026-05-06', total: 3 },
  ],
}

test.describe('hr dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route(DASHBOARD_ROUTE, (route) => route.fulfill({ json: MOCK_DASHBOARD }))
    await page.goto('/hr/dashboard')
  })

  test('renders page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard RH' })).toBeVisible()
  })

  test('renders all four stat card labels', async ({ page }) => {
    await expect(page.locator('p', { hasText: /^Pendentes$/ })).toBeVisible()
    await expect(page.locator('p', { hasText: /^Em Revisão$/ })).toBeVisible()
    await expect(page.locator('p', { hasText: /^Aprovados Hoje$/ })).toBeVisible()
    await expect(page.locator('p', { hasText: /^Rejeitados Hoje$/ })).toBeVisible()
  })

  test('renders correct values in stat cards', async ({ page }) => {
    const cards = page.locator('.rounded-lg.border.border-gray-200.bg-white')
    await expect(cards.filter({ hasText: 'Pendentes' }).getByText('3')).toBeVisible()
    await expect(cards.filter({ hasText: 'Em Revisão' }).getByText('1')).toBeVisible()
    await expect(cards.filter({ hasText: 'Aprovados Hoje' }).getByText('2')).toBeVisible()
    await expect(cards.filter({ hasText: 'Rejeitados Hoje' }).getByText('4')).toBeVisible()
  })

  test('renders chart section heading for last 30 days', async ({ page }) => {
    await expect(page.getByText('Despesas nos últimos 30 dias')).toBeVisible()
  })

  test('renders chart section heading for expenses by user', async ({ page }) => {
    await expect(page.getByText('Despesas por colaborador')).toBeVisible()
  })

  test('renders chart section heading for status distribution', async ({ page }) => {
    await expect(page.getByText('Distribuição de status')).toBeVisible()
  })

  test('renders chart section heading for fraud signals', async ({ page }) => {
    await expect(page.getByText('Sinais de fraude detectados')).toBeVisible()
  })

  test('pending stat card links to /hr/expenses?status=pending', async ({ page }) => {
    const link = page.getByRole('link', { name: /Pendentes/ })
    await expect(link).toHaveAttribute('href', '/hr/expenses?status=pending')
  })

  test('navbar renders Dashboard, Despesas and Categorias links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Despesas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Categorias' })).toBeVisible()
  })

  test('navbar renders Sair button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  })
})

test.describe('hr dashboard — empty state', () => {
  test('renders zeros when dashboard returns empty data', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route(DASHBOARD_ROUTE, (route) =>
      route.fulfill({
        json: {
          pending: 0,
          manualReview: 0,
          approvedToday: 0,
          rejectedToday: 0,
          statusDistribution: [],
          expensesByUser: [],
          fraudSignalCounts: [],
          expensesByDay: [],
        },
      })
    )
    await page.goto('/hr/dashboard')

    const cards = page.locator('.rounded-lg.border.border-gray-200.bg-white')
    await expect(cards.filter({ hasText: 'Pendentes' }).getByText('0')).toBeVisible()
    await expect(cards.filter({ hasText: 'Em Revisão' }).getByText('0')).toBeVisible()
  })
})
