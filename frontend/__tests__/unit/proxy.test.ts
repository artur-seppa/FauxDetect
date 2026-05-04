// @vitest-environment node
import { describe, test, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

function req(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')

  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  })
}

function redirectsTo(res: Response): string | null {
  const loc = res.headers.get('location')
  if (!loc) return null
  return new URL(loc).pathname
}

const employee = {
  token: 'tok',
  user_info: JSON.stringify({ id: 1, name: 'John', role: 'employee' }),
}

const hr = {
  token: 'tok',
  user_info: JSON.stringify({ id: 2, name: 'HR', role: 'hr' }),
}

const admin = {
  token: 'tok',
  user_info: JSON.stringify({ id: 3, name: 'Admin', role: 'admin' }),
}

// ─── Public / BFF pass-through ────────────────────────────────────────────────

describe('public and proxy routes pass through', () => {
  test('/api/auth/session is allowed', () => {
    expect(redirectsTo(proxy(req('/api/auth/session')))).toBeNull()
  })

  test('/api/proxy/expenses is allowed', () => {
    expect(redirectsTo(proxy(req('/api/proxy/expenses')))).toBeNull()
  })
})

// ─── Unauthenticated ──────────────────────────────────────────────────────────

describe('unauthenticated access', () => {
  test('/login renders (no redirect)', () => {
    expect(redirectsTo(proxy(req('/login')))).toBeNull()
  })

  test('/dashboard → /login', () => {
    expect(redirectsTo(proxy(req('/dashboard')))).toBe('/login')
  })

  test('/hr/dashboard → /login', () => {
    expect(redirectsTo(proxy(req('/hr/dashboard')))).toBe('/login')
  })

  test('/expenses/new → /login', () => {
    expect(redirectsTo(proxy(req('/expenses/new')))).toBe('/login')
  })
})

// ─── Authenticated on /login ──────────────────────────────────────────────────

describe('authenticated user on /login', () => {
  test('employee → /dashboard', () => {
    expect(redirectsTo(proxy(req('/login', employee)))).toBe('/dashboard')
  })

  test('hr → /hr/dashboard', () => {
    expect(redirectsTo(proxy(req('/login', hr)))).toBe('/hr/dashboard')
  })

  test('admin → /hr/dashboard', () => {
    expect(redirectsTo(proxy(req('/login', admin)))).toBe('/hr/dashboard')
  })
})

// ─── Employee role isolation ──────────────────────────────────────────────────

describe('employee role', () => {
  test('can access /dashboard', () => {
    expect(redirectsTo(proxy(req('/dashboard', employee)))).toBeNull()
  })

  test('can access /expenses/new', () => {
    expect(redirectsTo(proxy(req('/expenses/new', employee)))).toBeNull()
  })

  test('blocked from /hr/dashboard → /dashboard', () => {
    expect(redirectsTo(proxy(req('/hr/dashboard', employee)))).toBe('/dashboard')
  })

  test('blocked from /hr/expenses → /dashboard', () => {
    expect(redirectsTo(proxy(req('/hr/expenses', employee)))).toBe('/dashboard')
  })
})

// ─── HR role isolation ────────────────────────────────────────────────────────

describe('hr role', () => {
  test('can access /hr/dashboard', () => {
    expect(redirectsTo(proxy(req('/hr/dashboard', hr)))).toBeNull()
  })

  test('can access /hr/expenses', () => {
    expect(redirectsTo(proxy(req('/hr/expenses', hr)))).toBeNull()
  })

  test('blocked from /dashboard → /hr/dashboard', () => {
    expect(redirectsTo(proxy(req('/dashboard', hr)))).toBe('/hr/dashboard')
  })

  test('blocked from /expenses → /hr/dashboard', () => {
    expect(redirectsTo(proxy(req('/expenses', hr)))).toBe('/hr/dashboard')
  })
})

// ─── Admin role (same home as HR) ─────────────────────────────────────────────

describe('admin role', () => {
  test('can access /hr/dashboard', () => {
    expect(redirectsTo(proxy(req('/hr/dashboard', admin)))).toBeNull()
  })

  test('blocked from /dashboard → /hr/dashboard', () => {
    expect(redirectsTo(proxy(req('/dashboard', admin)))).toBe('/hr/dashboard')
  })
})
