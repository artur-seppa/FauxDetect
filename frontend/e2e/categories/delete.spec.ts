import { test, expect } from '@playwright/test'
import { HR, setAuthCookies } from '../helpers'
import { INITIAL_CATEGORIES } from './helpers'

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
