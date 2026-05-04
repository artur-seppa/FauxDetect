'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getStoredUserInfo, useAuth } from '@/hooks/use-auth'
import type { UserInfo } from '@/hooks/use-auth'

interface AuthContextValue {
  user: UserInfo | null
  isLoading: boolean
  refreshUser: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { logout: authLogout } = useAuth()

  const refreshUser = useCallback(() => {
    setUser(getStoredUserInfo())
  }, [])

  useEffect(() => {
    setUser(getStoredUserInfo())
    setIsLoading(false)
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setUser(null)
  }, [authLogout])

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
