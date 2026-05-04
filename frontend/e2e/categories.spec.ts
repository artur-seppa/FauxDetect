import { test, expect, type BrowserContext } from '@playwright/test'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HR = { id: 2, name: 'HR User', role: 'hr' }
const EMPLOYEE = { id: 1, name: 'John Employee', role: 'employee' }

async function setAuthCookies(ctx: BrowserContext, user: typeof HR | typeof EMPLOYEE) {
  await ctx.addCookies([
    {
      name: 'token',
      value: 'mock-jwt-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'user_info',
      value: JSON.stringify(user),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

interface MockCategory {
  id: number
  name: string
  maxAmount: number | null
  active: boolean
  keywords: string[]
}

const INITIAL_CATEGORIES: MockCategory[] = [
  { id: 1, name: 'Almoço', maxAmount: 50, active: true, keywords: ['restaurante', 'comida', 'almoço'] },
  { id: 2, name: 'Uber', maxAmount: 100, active: true, keywords: ['uber', 'taxi'] },
  { id: 3, name: 'Hotel', maxAmount: null, active: false, keywords: [] },
]

// ─── Access control ───────────────────────────────────────────────────────────

test.describe('access control', () => {
  test('unauthenticated → redirected to /login', async ({ page }) => {
    await page.goto('/hr/categories')
    await expect(page).toHaveURL('/login')
  })

  test('employee blocked from /hr/categories → /dashboard', async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.goto('/hr/categories')
    await expect(page).toHaveURL('/dashboard')
  })

  test('HR can access /hr/categories', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route('/api/categories', (route) => route.fulfill({ json: INITIAL_CATEGORIES }))
    await page.goto('/hr/categories')
    await expect(page).toHaveURL('/hr/categories')
  })
})

// ─── Listing ──────────────────────────────────────────────────────────────────

test.describe('categories listing', () => {
  test.beforeEach(async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route('/api/categories', (route) => route.fulfill({ json: INITIAL_CATEGORIES }))
    await page.goto('/hr/categories')
  })

  test('renders page heading and create button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Categorias' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nova Categoria' })).toBeVisible()
  })

  test('renders all category names', async ({ page }) => {
    // exact: true to avoid matching keyword badges with the same text
    await expect(page.getByRole('cell', { name: 'Almoço', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Uber', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Hotel', exact: true })).toBeVisible()
  })

  test('renders keywords as badges', async ({ page }) => {
    await expect(page.getByText('restaurante', { exact: true })).toBeVisible()
    await expect(page.getByText('comida', { exact: true })).toBeVisible()
    // 'uber' (lowercase badge) is distinct from 'Uber' (category name) with exact match
    await expect(page.getByText('uber', { exact: true })).toBeVisible()
    await expect(page.getByText('taxi', { exact: true })).toBeVisible()
  })

  test('renders — for category without keywords', async ({ page }) => {
    const hotelRow = page.getByRole('row', { name: /Hotel/ })
    // empty keywords cell shows a <span class="text-gray-400">—</span>
    await expect(hotelRow.locator('span.text-gray-400')).toBeVisible()
  })

  test('renders formatted limit for Almoço', async ({ page }) => {
    await expect(page.getByText('R$ 50,00')).toBeVisible()
  })

  test('renders Inativa status for Hotel', async ({ page }) => {
    const hotelRow = page.getByRole('row', { name: /Hotel/ })
    await expect(hotelRow.getByText('Inativa')).toBeVisible()
  })

  test('renders Ativa status for active categories', async ({ page }) => {
    const almocRow = page.getByRole('row', { name: /Almoço/ })
    await expect(almocRow.getByText('Ativa')).toBeVisible()
  })

  test('renders Editar and Excluir buttons for each row', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Editar' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Excluir' }).first()).toBeVisible()
  })
})

test.describe('empty state', () => {
  test('shows empty message when no categories exist', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route('/api/categories', (route) => route.fulfill({ json: [] }))
    await page.goto('/hr/categories')
    await expect(page.getByText('Nenhuma categoria cadastrada.')).toBeVisible()
  })
})

// ─── Create ───────────────────────────────────────────────────────────────────

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

    const created = { id: 10, name: 'Parking', maxAmount: 30, active: true, keywords: ['parking', 'valet'] }
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

// ─── Edit ─────────────────────────────────────────────────────────────────────

test.describe('edit category', () => {
  test.beforeEach(async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route('/api/categories', (route) => route.fulfill({ json: INITIAL_CATEGORIES }))
    await page.goto('/hr/categories')
  })

  test('opens drawer pre-filled with existing values', async ({ page }) => {
    const almocRow = page.getByRole('row', { name: /Almoço/ })
    await almocRow.getByRole('button', { name: 'Editar' }).click()

    await expect(page.getByRole('heading', { name: 'Editar Categoria' })).toBeVisible()
    await expect(page.getByLabel('Nome')).toHaveValue('Almoço')
    await expect(page.getByLabel('Keywords')).toHaveValue('restaurante, comida, almoço')
    await expect(page.getByLabel('Limite (R$)')).toHaveValue('50')
  })

  test('pre-fills empty keywords for category without keywords', async ({ page }) => {
    const hotelRow = page.getByRole('row', { name: /Hotel/ })
    await hotelRow.getByRole('button', { name: 'Editar' }).click()
    await expect(page.getByLabel('Keywords')).toHaveValue('')
  })

  test('saves updated keywords', async ({ page }) => {
    const updated = { ...INITIAL_CATEGORIES[0], keywords: ['restaurante', 'lanche'] }
    let categories = [...INITIAL_CATEGORIES]

    await page.route('/api/categories/1', async (route) => {
      categories = categories.map((c) => (c.id === 1 ? updated : c))
      await route.fulfill({ json: updated })
    })
    await page.route('/api/categories', (route) => route.fulfill({ json: categories }))

    const almocRow = page.getByRole('row', { name: /Almoço/ })
    await almocRow.getByRole('button', { name: 'Editar' }).click()
    await page.getByLabel('Keywords').fill('restaurante, lanche')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('lanche', { exact: true })).toBeVisible()
    await expect(page.getByText('comida', { exact: true })).not.toBeVisible()
  })
})

// ─── Delete ───────────────────────────────────────────────────────────────────

test.describe('delete category', () => {
  test('opens confirm modal on Excluir click', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route('/api/categories', (route) => route.fulfill({ json: INITIAL_CATEGORIES }))
    await page.goto('/hr/categories')

    const almocRow = page.getByRole('row', { name: /Almoço/ })
    await almocRow.getByRole('button', { name: 'Excluir' }).click()
    await expect(page.getByText(/Tem certeza que deseja excluir "Almoço"/)).toBeVisible()
  })

  test('removes row after confirming delete', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    let categories = [...INITIAL_CATEGORIES]

    await page.route('/api/categories', (route) => route.fulfill({ json: categories }))
    await page.route('/api/categories/1', async (route) => {
      categories = categories.filter((c) => c.id !== 1)
      await route.fulfill({ json: { message: 'Category deleted successfully' } })
    })

    await page.goto('/hr/categories')

    const almocRow = page.getByRole('row', { name: /Almoço/ })
    await almocRow.getByRole('button', { name: 'Excluir' }).click()
    // scope to the confirm modal card to avoid matching table's Excluir buttons
    await page.getByTestId('confirm-modal').getByRole('button', { name: 'Excluir' }).click()

    await expect(page.getByRole('cell', { name: 'Almoço', exact: true })).not.toBeVisible()
  })

  test('cancels delete without removing row', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route('/api/categories', (route) => route.fulfill({ json: INITIAL_CATEGORIES }))
    await page.goto('/hr/categories')

    const almocRow = page.getByRole('row', { name: /Almoço/ })
    await almocRow.getByRole('button', { name: 'Excluir' }).click()
    // scope to the confirm modal card to avoid matching drawer's Cancelar button
    await page.getByTestId('confirm-modal').getByRole('button', { name: 'Cancelar' }).click()

    await expect(page.getByRole('cell', { name: 'Almoço', exact: true })).toBeVisible()
  })
})

// ─── Toggle active ────────────────────────────────────────────────────────────

test.describe('toggle active status', () => {
  test('toggles category from active to inactive', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    const toggled = { ...INITIAL_CATEGORIES[0], active: false }
    let categories = [...INITIAL_CATEGORIES]

    await page.route('/api/categories', (route) => route.fulfill({ json: categories }))
    await page.route('/api/categories/1', async (route) => {
      categories = categories.map((c) => (c.id === 1 ? toggled : c))
      await route.fulfill({ json: toggled })
    })

    await page.goto('/hr/categories')

    const almocRow = page.getByRole('row', { name: /Almoço/ })
    await almocRow.getByRole('button', { name: 'Ativa' }).click()

    await expect(almocRow.getByRole('button', { name: 'Inativa' })).toBeVisible()
  })
})
