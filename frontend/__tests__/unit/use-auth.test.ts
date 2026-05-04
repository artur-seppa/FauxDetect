import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest'
import { getStoredUserInfo } from '@/hooks/use-auth'

vi.mock('js-cookie', () => ({
  default: { get: vi.fn() },
}))

import Cookies from 'js-cookie'

const mockGet = Cookies.get as unknown as Mock<(name: string) => string | undefined>

describe('getStoredUserInfo', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns null when no cookie', () => {
    mockGet.mockReturnValue(undefined)
    expect(getStoredUserInfo()).toBeNull()
  })

  test('returns parsed user from cookie', () => {
    const user = { id: 1, name: 'John', role: 'employee' as const }
    mockGet.mockReturnValue(JSON.stringify(user))
    expect(getStoredUserInfo()).toEqual(user)
  })

  test('returns null when cookie has invalid JSON', () => {
    mockGet.mockReturnValue('not-valid-json{{{')
    expect(getStoredUserInfo()).toBeNull()
  })
})

describe('useAuth — login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  test('returns user on successful login', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useAuth } = await import('@/hooks/use-auth')

    const user = { id: 1, name: 'John', role: 'employee', email: 'john@test.com', department: 'IT' }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ user }), { status: 200 })
    )

    const { result } = renderHook(() => useAuth())
    const returned = await result.current.login('john@test.com', 'password123')
    expect(returned).toEqual(user)
  })

  test('throws on invalid credentials (non-2xx response)', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useAuth } = await import('@/hooks/use-auth')

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Credenciais inválidas.' }), { status: 401 })
    )

    const { result } = renderHook(() => useAuth())
    await expect(result.current.login('bad@test.com', 'wrong')).rejects.toThrow('Credenciais inválidas.')
  })
})

describe('useAuth — logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('location', { href: '' })
  })

  test('calls DELETE /api/auth/session and redirects to /login', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useAuth } = await import('@/hooks/use-auth')

    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))

    const { result } = renderHook(() => useAuth())
    await result.current.logout()

    expect(fetch).toHaveBeenCalledWith('/api/auth/session', { method: 'DELETE' })
    expect(window.location.href).toBe('/login')
  })
})
