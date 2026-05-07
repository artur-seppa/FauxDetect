import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../messages/pt.json'

function IntlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="pt" messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

export function renderWithIntl(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: IntlWrapper, ...options })
}
