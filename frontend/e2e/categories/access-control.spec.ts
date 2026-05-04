import { test, expect } from '@playwright/test'
import { EMPLOYEE, HR, setAuthCookies } from '../helpers'
import { INITIAL_CATEGORIES } from './helpers'

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
