import { test, expect } from '@playwright/test'
import { HR, setAuthCookies } from '../helpers'
import { INITIAL_CATEGORIES } from './helpers'

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
