import type { BrowserContext } from '@playwright/test'

export const EMPLOYEE = { id: 1, name: 'John Employee', role: 'employee' }
export const HR = { id: 2, name: 'HR User', role: 'hr' }

export async function setAuthCookies(
  ctx: BrowserContext,
  user: typeof EMPLOYEE | typeof HR
) {
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
