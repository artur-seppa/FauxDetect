import { test, expect } from '@playwright/test'
import { EMPLOYEE, HR, setAuthCookies } from './helpers'

// ─── Route protection ─────────────────────────────────────────────────────────

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

// ─── Login form ───────────────────────────────────────────────────────────────

test.describe('login form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'FauxDetect' })).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('shows validation error for invalid email', async ({ page }) => {
    await page.getByLabel('E-mail').fill('not-an-email')
    await page.getByLabel('Senha').fill('password123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('E-mail inválido')).toBeVisible()
  })

  test('shows validation error for short password', async ({ page }) => {
    await page.getByLabel('E-mail').fill('user@test.com')
    await page.getByLabel('Senha').fill('123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('Mínimo 8 caracteres')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.route('/api/auth/session', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Credenciais inválidas.' }),
      })
    )

    await page.getByLabel('E-mail').fill('wrong@test.com')
    await page.getByLabel('Senha').fill('wrongpassword')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('E-mail ou senha inválidos.')).toBeVisible()
  })

  test('employee login → /dashboard', async ({ page, context }) => {
    await page.route('/api/auth/session', async (route) => {
      // Set cookies so the proxy allows the subsequent navigation
      await context.addCookies([
        { name: 'token', value: 'mock-token', domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' },
        { name: 'user_info', value: JSON.stringify(EMPLOYEE), domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
      ])
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: EMPLOYEE }),
      })
    })

    await page.getByLabel('E-mail').fill('john@company.com')
    await page.getByLabel('Senha').fill('password123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('HR login → /hr/dashboard', async ({ page, context }) => {
    await page.route('/api/auth/session', async (route) => {
      await context.addCookies([
        { name: 'token', value: 'mock-token', domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' },
        { name: 'user_info', value: JSON.stringify(HR), domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
      ])
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: HR }),
      })
    })

    await page.getByLabel('E-mail').fill('hr@company.com')
    await page.getByLabel('Senha').fill('admin123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL('/hr/dashboard')
  })
})

// ─── Logout ───────────────────────────────────────────────────────────────────

test.describe('logout', () => {
  test('employee logout → /login with cookies cleared', async ({ page, context }) => {
    await setAuthCookies(context, EMPLOYEE)
    await page.goto('/dashboard')

    await page.route('/api/auth/session', async (route) => {
      await context.clearCookies()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL('/login')
  })
})
