import { test, expect } from '@playwright/test'
import { HR, setAuthCookies } from '../helpers'
import { INITIAL_CATEGORIES } from './helpers'

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
