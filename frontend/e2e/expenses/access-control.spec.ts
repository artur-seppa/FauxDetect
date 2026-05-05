import { test, expect } from '@playwright/test'
import { EMPLOYEE, HR, setAuthCookies } from '../helpers'

test.describe('expenses access control', () => {
  test('unauthenticated → /login on /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated → /login on /hr/expenses', async ({ page }) => {
    await page.goto('/hr/expenses')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated → /login on employee expense detail', async ({ page }) => {
    await page.goto('/expenses/some-id')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated → /login on hr expense detail', async ({ page }) => {
    await page.goto('/hr/expenses/some-id')
    await expect(page).toHaveURL('/login')
  })

  test('employee blocked from /hr/expenses → /dashboard', async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.goto('/hr/expenses')
    await expect(page).toHaveURL('/dashboard')
  })

  test('hr blocked from /dashboard → /hr/dashboard', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/hr/dashboard')
  })

  test('hr blocked from /expenses/id → /hr/dashboard', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.goto('/expenses/some-id')
    await expect(page).toHaveURL('/hr/dashboard')
  })

  test('employee can access /dashboard', async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.route('/api/expenses', (route) => route.fulfill({ json: [] }))
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('hr can access /hr/expenses', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.route(/\/api\/expenses(\?.*)?$/, (route) => route.fulfill({ json: [] }))
    await page.goto('/hr/expenses')
    await expect(page).toHaveURL('/hr/expenses')
  })
})
