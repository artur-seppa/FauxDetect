import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const SUPPORTED = ['en', 'pt'] as const
type Locale = (typeof SUPPORTED)[number]

function isSupported(v: string | undefined): v is Locale {
  return SUPPORTED.includes(v as Locale)
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('locale')?.value
  const locale: Locale = isSupported(raw) ? raw : 'pt'

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
