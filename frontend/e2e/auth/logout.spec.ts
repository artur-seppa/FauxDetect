import { test, expect } from '@playwright/test'
import { EMPLOYEE, setAuthCookies } from '../helpers'

test.describe('logout', () => {
  test('employee logout → /login with cookies cleared', async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL('/login')
  })
})
