'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { api } from '@/lib/api'
import type { AuthResponse } from '@/lib/types'

export function useAuth() {
  const router = useRouter()

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }, [router])

  const getUser = useCallback(() => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthResponse['user']
    } catch {
      return null
    }
  }, [])

  return { login, logout, getUser }
}
