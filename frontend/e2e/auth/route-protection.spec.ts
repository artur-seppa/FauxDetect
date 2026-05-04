import { test, expect } from '@playwright/test'
import { EMPLOYEE, HR, setAuthCookies } from '../helpers'

test.describe('route protection', () => {
  test('unauthenticated /dashboard → /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated /hr/dashboard → /login', async ({ page }) => {
    await page.goto('/hr/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated /expenses/new → /login', async ({ page }) => {
    await page.goto('/expenses/new')
    await expect(page).toHaveURL('/login')
  })

  test('authenticated employee can access /dashboard', async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('employee blocked from /hr/dashboard → /dashboard', async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.goto('/hr/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('authenticated HR can access /hr/dashboard', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.goto('/hr/dashboard')
    await expect(page).toHaveURL('/hr/dashboard')
  })

  test('HR blocked from /dashboard → /hr/dashboard', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/hr/dashboard')
  })

  test('authenticated employee /login → /dashboard', async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.goto('/login')
    await expect(page).toHaveURL('/dashboard')
  })

  test('authenticated HR /login → /hr/dashboard', async ({ page, context }) => {
    await setAuthCookies(context, HR)
    await page.goto('/login')
    await expect(page).toHaveURL('/hr/dashboard')
  })
})
