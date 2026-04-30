'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/hr/dashboard', label: 'Dashboard' },
  { href: '/hr/expenses', label: 'Despesas' },
]

export default function HrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { logout } = useAuthContext()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-bold text-blue-600">FauxDetect <span className="text-xs font-normal text-gray-400">RH</span></span>
          <nav className="flex gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname.startsWith(link.href) ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-gray-900">
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
