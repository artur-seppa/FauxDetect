'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'
import type { AuthResponse, User } from '@/lib/types'

const COOKIE_TOKEN = 'token'
const COOKIE_USER = 'user'

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,
  path: '/',
  sameSite: 'Lax',
}

export function setAuthCookies(token: string, user: User) {
  Cookies.set(COOKIE_TOKEN, token, COOKIE_OPTIONS)
  Cookies.set(COOKIE_USER, JSON.stringify(user), COOKIE_OPTIONS)
}

export function clearAuthCookies() {
  Cookies.remove(COOKIE_TOKEN, { path: '/' })
  Cookies.remove(COOKIE_USER, { path: '/' })
}

export function getStoredUser(): User | null {
  const raw = Cookies.get(COOKIE_USER)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function useAuth() {
  const router = useRouter()

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    setAuthCookies(data.token, data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAuthCookies()
      router.push('/login')
    }
  }, [router])

  const getUser = useCallback(() => getStoredUser(), [])

  return { login, logout, getUser }
}
