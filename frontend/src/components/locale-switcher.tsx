'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()

  function switchTo(next: string) {
    document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      <button
        onClick={() => switchTo('en')}
        className={locale === 'en' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-700'}
      >
        EN
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => switchTo('pt')}
        className={locale === 'pt' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-700'}
      >
        PT
      </button>
    </div>
  )
}
