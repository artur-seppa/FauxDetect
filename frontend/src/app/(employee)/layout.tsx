'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuthContext } from '@/contexts/auth-context'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { cn } from '@/lib/utils'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { logout } = useAuthContext()
  const t = useTranslations('nav')

  const navLinks = [{ href: '/dashboard', label: t('employee.myExpenses') }]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-bold text-emerald-700">FauxDetect</span>
          <nav className="flex gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname === link.href ? 'text-emerald-700' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-gray-900">
              {t('logout')}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
