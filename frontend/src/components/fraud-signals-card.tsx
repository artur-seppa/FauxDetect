'use client'

import { useTranslations } from 'next-intl'
import type { FraudSignals } from '@/lib/types'

type FraudKey = Exclude<keyof FraudSignals, 'amountExceedsCategoryLimit'>

const FRAUD_KEYS: FraudKey[] = [
  'geminiDigitalTampering',
  'geminiAiGenerated',
  'geminiNotADocument',
  'geminiInconsistentData',
]

interface FraudSignalsCardProps {
  signals: FraudSignals
  fraudScore: number
  fraudDetails?: string | null
}

export function FraudSignalsCard({ signals, fraudScore, fraudDetails }: FraudSignalsCardProps) {
  const t = useTranslations('fraudSignals')
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t('title')}</h3>
        <span
          className={`text-sm font-bold ${
            fraudScore >= 70
              ? 'text-red-600'
              : fraudScore >= 40
                ? 'text-yellow-600'
                : 'text-green-600'
          }`}
        >
          Score: {fraudScore}/100
        </span>
      </div>
      <ul className="space-y-1.5">
        {FRAUD_KEYS.map((key) => {
          const active = signals[key] ?? false
          return (
            <li
              key={key}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                active ? 'bg-red-50' : 'bg-gray-50'
              }`}
            >
              <span className={active ? 'font-medium text-red-700' : 'text-gray-500'}>
                {t(key)}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {active ? t('detected') : t('ok')}
              </span>
            </li>
          )
        })}
      </ul>
      {fraudDetails && fraudDetails !== 'no fraud signals detected' && (
        <p className="mt-3 rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          {fraudDetails}
        </p>
      )}
    </div>
  )
}
