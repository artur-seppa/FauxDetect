import { test, expect } from '@playwright/test'
import { HR, setAuthCookies } from '../helpers'
import { HR_PENDING_EXPENSE, MOCK_MANUAL_REVIEW_EXPENSE, MOCK_REJECTED_EXPENSE } from './helpers'

const EXPENSE_ROUTE = `/api/expenses/${HR_PENDING_EXPENSE.id}`
const APPROVE_ROUTE = `/api/expenses/${HR_PENDING_EXPENSE.id}/approve`
const REJECT_ROUTE = `/api/expenses/${HR_PENDING_EXPENSE.id}/reject`
const EXPENSE_PAGE = `/hr/expenses/${HR_PENDING_EXPENSE.id}`

test.describe('hr expense detail — rendering', () => {
  test.beforeEach(async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route(EXPENSE_ROUTE, (route) => route.fulfill({ json: HR_PENDING_EXPENSE }))
    await page.goto(EXPENSE_PAGE)
  })

  test('renders filename as heading and status badge', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'nota-fiscal.png' })).toBeVisible()
    await expect(page.getByText('Pendente')).toBeVisible()
  })

  test('renders Voltar link pointing to /hr/expenses', async ({ page }) => {
    const voltar = page.getByRole('link', { name: '← Voltar' })
    await expect(voltar).toBeVisible()
    await expect(voltar).toHaveAttribute('href', '/hr/expenses')
  })

  test('renders employee name in extracted data', async ({ page }) => {
    await expect(page.getByText('John Employee')).toBeVisible()
  })

  test('renders extracted amount, vendor and description', async ({ page }) => {
    await expect(page.getByText('R$ 45,50')).toBeVisible()
    await expect(page.getByText('Restaurante do João')).toBeVisible()
    await expect(page.getByText('Almoço executivo')).toBeVisible()
  })

  test('renders fraud signals card', async ({ page }) => {
    await expect(page.getByText('Sinais de Fraude')).toBeVisible()
    await expect(page.getByText('Score: 0/100')).toBeVisible()
  })

  test('renders category match badge', async ({ page }) => {
    await expect(page.getByText('Corresponde à categoria "Almoço"')).toBeVisible()
  })
})

test.describe('hr expense detail — review actions', () => {
  test.beforeEach(async ({ page, context }) => {
    await setAuthCookies(context, HR)
  })

  test('shows Aprovar and Rejeitar buttons for pending expense', async ({ page }) => {
    await page.route(EXPENSE_ROUTE, (route) => route.fulfill({ json: HR_PENDING_EXPENSE }))
    await page.goto(EXPENSE_PAGE)
    await expect(page.getByRole('button', { name: 'Aprovar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rejeitar' })).toBeVisible()
  })

  test('shows Aprovar and Rejeitar buttons for manual_review expense', async ({ page }) => {
    const id = MOCK_MANUAL_REVIEW_EXPENSE.id
    await page.route(`/api/expenses/${id}`, (route) =>
      route.fulfill({ json: { ...MOCK_MANUAL_REVIEW_EXPENSE, user: { id: 1, fullName: 'John Employee', email: 'john@company.com' } } })
    )
    await page.goto(`/hr/expenses/${id}`)
    await expect(page.getByRole('button', { name: 'Aprovar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rejeitar' })).toBeVisible()
  })

  test('does not show action buttons for approved expense', async ({ page }) => {
    const approved = { ...HR_PENDING_EXPENSE, status: 'approved', approvedBy: 2, approvedAt: new Date().toISOString() }
    await page.route(EXPENSE_ROUTE, (route) => route.fulfill({ json: approved }))
    await page.goto(EXPENSE_PAGE)
    await expect(page.getByRole('button', { name: 'Aprovar' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Rejeitar' })).not.toBeVisible()
  })

  test('does not show action buttons for rejected expense', async ({ page }) => {
    const id = MOCK_REJECTED_EXPENSE.id
    await page.route(`/api/expenses/${id}`, (route) =>
      route.fulfill({ json: { ...MOCK_REJECTED_EXPENSE, user: { id: 1, fullName: 'John Employee', email: 'john@company.com' } } })
    )
    await page.goto(`/hr/expenses/${id}`)
    await expect(page.getByRole('button', { name: 'Aprovar' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Rejeitar' })).not.toBeVisible()
  })
})

test.describe('hr expense detail — approve flow', () => {
  test('approve button calls PATCH and redirects to /hr/expenses', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route(EXPENSE_ROUTE, (route) => route.fulfill({ json: HR_PENDING_EXPENSE }))
    await page.route(APPROVE_ROUTE, (route) =>
      route.fulfill({ json: { ...HR_PENDING_EXPENSE, status: 'approved' } })
    )
    await page.route(/\/api\/expenses(\?.*)?$/, (route) => route.fulfill({ json: [] }))
    await page.goto(EXPENSE_PAGE)

    await page.getByRole('button', { name: 'Aprovar' }).click()
    await expect(page).toHaveURL('/hr/expenses')
  })
})

test.describe('hr expense detail — reject flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route(EXPENSE_ROUTE, (route) => route.fulfill({ json: HR_PENDING_EXPENSE }))
    await page.route(REJECT_ROUTE, (route) =>
      route.fulfill({ json: { ...HR_PENDING_EXPENSE, status: 'rejected', rejectionReason: 'Inválido.' } })
    )
    await page.route(/\/api\/expenses(\?.*)?$/, (route) => route.fulfill({ json: [] }))
    await page.goto(EXPENSE_PAGE)
  })

  test('clicking Rejeitar shows reason textarea', async ({ page }) => {
    await page.getByRole('button', { name: 'Rejeitar' }).click()
    await expect(page.getByPlaceholder('Motivo da rejeição…')).toBeVisible()
  })

  test('Confirmar Rejeição is disabled when reason is empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Rejeitar' }).click()
    await expect(page.getByRole('button', { name: 'Confirmar Rejeição' })).toBeDisabled()
  })

  test('Confirmar Rejeição is enabled after typing a reason', async ({ page }) => {
    await page.getByRole('button', { name: 'Rejeitar' }).click()
    await page.getByPlaceholder('Motivo da rejeição…').fill('Inválido.')
    await expect(page.getByRole('button', { name: 'Confirmar Rejeição' })).toBeEnabled()
  })

  test('submitting rejection redirects to /hr/expenses', async ({ page }) => {
    await page.getByRole('button', { name: 'Rejeitar' }).click()
    await page.getByPlaceholder('Motivo da rejeição…').fill('Inválido.')
    await page.getByRole('button', { name: 'Confirmar Rejeição' }).click()
    await expect(page).toHaveURL('/hr/expenses')
  })

  test('Cancelar hides reject form and restores action buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Rejeitar' }).click()
    await expect(page.getByPlaceholder('Motivo da rejeição…')).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByPlaceholder('Motivo da rejeição…')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Aprovar' })).toBeVisible()
  })
})
