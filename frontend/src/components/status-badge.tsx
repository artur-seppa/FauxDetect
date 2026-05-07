'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ExpenseStatus } from '@/lib/types'

const styles: Record<ExpenseStatus, string> = {
  processing: 'bg-gray-100 text-gray-700',
  pending: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  manual_review: 'bg-yellow-100 text-yellow-700',
}

interface StatusBadgeProps {
  status: ExpenseStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations('status')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
        className
      )}
    >
      {t(status)}
    </span>
  )
}
