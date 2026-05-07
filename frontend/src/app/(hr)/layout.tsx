'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuthContext } from '@/contexts/auth-context'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { cn } from '@/lib/utils'

export default function HrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { logout } = useAuthContext()
  const t = useTranslations('nav')

  const navLinks = [
    { href: '/hr/dashboard', label: t('hr.dashboard') },
    { href: '/hr/expenses', label: t('hr.expenses') },
    { href: '/hr/categories', label: t('hr.categories') },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="font-bold text-emerald-700">
            FauxDetect <span className="text-xs font-normal text-gray-400">HR</span>
          </span>
          <nav className="order-3 flex w-full gap-4 sm:order-2 sm:w-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname.startsWith(link.href) ? 'text-emerald-700' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="order-2 flex items-center gap-4 sm:order-3">
            <LocaleSwitcher />
            <button
              onClick={() => logout()}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
