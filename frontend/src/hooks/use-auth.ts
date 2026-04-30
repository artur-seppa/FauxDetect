'use client'

import { useCallback } from 'react'
import Cookies from 'js-cookie'
import type { AuthResponse, User } from '@/lib/types'

export interface UserInfo {
  id: number
  name: string
  role: User['role']
}

export function getStoredUserInfo(): UserInfo | null {
  const raw = Cookies.get('user_info')
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserInfo
  } catch {
    return null
  }
}

export function useAuth() {
  const login = useCallback(async (email: string, password: string): Promise<AuthResponse['user']> => {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? 'Credenciais inválidas.')
    }

    const data: { user: AuthResponse['user'] } = await res.json()
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => null)
    window.location.href = '/login'
  }, [])

  return { login, logout }
}
