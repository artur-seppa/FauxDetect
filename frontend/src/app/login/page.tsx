'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { useAuthContext } from '@/contexts/auth-context'

type FormData = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { refreshUser } = useAuthContext()
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('login')

  const schema = z.object({
    email: z.email(t('emailInvalid')),
    password: z.string().min(8, t('passwordMin')),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const user = await login(data.email, data.password)
      refreshUser()
      router.push(user.role === 'employee' ? '/dashboard' : '/hr/dashboard')
    } catch {
      setError(t('error'))
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900">FauxDetect</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </main>
  )
}
