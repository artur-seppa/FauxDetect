import { test, expect } from '@playwright/test'
import { HR, setAuthCookies } from '../helpers'
import { INITIAL_CATEGORIES } from './helpers'

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
