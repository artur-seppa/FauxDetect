'use client'

import { use, useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import type { Expense } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { FraudSignalsCard } from '@/components/fraud-signals-card'
import { CategoryMatchBadge } from '@/components/category-match-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function HrExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('hrExpenseDetail')
  const tCommon = useTranslations('common')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const { data: expense, isLoading } = useQuery({
    queryKey: ['hr-expense', id],
    queryFn: () => api.get<Expense>(`/expenses/${id}`).then((r) => r.data),
  })

  const approve = useMutation({
    mutationFn: () => api.patch(`/expenses/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-expense', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-expenses'] })
      router.push('/hr/expenses')
    },
  })

  const reject = useMutation({
    mutationFn: () => api.patch(`/expenses/${id}/reject`, { rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-expense', id] })
      queryClient.invalidateQueries({ queryKey: ['hr-expenses'] })
      router.push('/hr/expenses')
    },
  })

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-dashed border-gray-300 bg-gray-50 px-5 py-3 text-center">
          <Skeleton className="mx-auto h-3 w-40" />
        </div>
        <dl className="divide-y divide-dashed divide-gray-200 px-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </dl>
        <div className="border-t-2 border-dashed border-gray-300 bg-gray-50 px-5 py-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  )
  if (!expense) return <p className="text-sm text-red-500">{t('notFound')}</p>

  const canReview = expense.status === 'pending' || expense.status === 'manual_review'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-xl font-semibold" title={expense.originalFilename}>{expense.originalFilename}</h1>
          <StatusBadge status={expense.status} />
        </div>

        {/* mobile: actions dropdown */}
        <div className="relative sm:hidden" ref={actionsRef}>
          <button
            onClick={() => setActionsOpen((o) => !o)}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {tCommon('actions')}
            <svg className={`ml-1.5 h-4 w-4 transition-transform ${actionsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {actionsOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <ul className="p-1 text-sm text-gray-700">
                {expense.fileUrl && (
                  <li>
                    <a
                      href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${expense.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center rounded px-3 py-2 hover:bg-gray-100"
                      onClick={() => setActionsOpen(false)}
                    >
                      {t('viewReceipt')}
                    </a>
                  </li>
                )}
                <li>
                  <Link
                    href="/hr/expenses"
                    className="inline-flex w-full items-center rounded px-3 py-2 hover:bg-gray-100"
                    onClick={() => setActionsOpen(false)}
                  >
                    {tCommon('back')}
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* desktop: individual buttons */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {expense.fileUrl && (
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${expense.fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {t('viewReceipt')}
            </a>
          )}
          <Link
            href="/hr/expenses"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {tCommon('back')}
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-dashed border-gray-300 bg-gray-50 px-5 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{t('receiptCardTitle')}</p>
          </div>
          <dl className="divide-y divide-dashed divide-gray-200 px-5 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">{t('employee')}</dt>
              <dd className="font-medium">{expense.user?.fullName ?? '—'}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">{t('vendor')}</dt>
              <dd className="font-medium">{expense.extractedVendor ?? '—'}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">{t('date')}</dt>
              <dd>{formatDate(expense.extractedDate)}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">{t('category')}</dt>
              <dd className="font-medium">{(expense.selectedCategory ?? expense.category)?.name ?? '—'}</dd>
            </div>
            {expense.extractedDescription && (
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-500">{t('description')}</dt>
                <dd className="max-w-[60%] text-right text-gray-700">{expense.extractedDescription}</dd>
              </div>
            )}
          </dl>
          <div className="border-t-2 border-dashed border-gray-300 bg-gray-50 px-5 py-3">
            <div className="flex justify-between text-sm font-bold text-gray-800">
              <span>{t('total')}</span>
              <span>{formatCurrency(expense.extractedAmount)}</span>
            </div>
          </div>
        </div>

        <CategoryMatchBadge
          match={expense.categoryMatch}
          categoryName={(expense.selectedCategory ?? expense.category)?.name}
          categoryExceedsLimit={expense.categoryExceedsLimit}
          categoryExceedsLimitDetail={expense.categoryExceedsLimitDetail}
        />

        {expense.fraudSignals && (
          <FraudSignalsCard signals={expense.fraudSignals} fraudScore={expense.fraudScore} fraudDetails={expense.fraudDetails} />
        )}

        {expense.rejectionReason && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>{t('rejectionReason')}:</strong> {expense.rejectionReason}
          </div>
        )}

        {canReview && (
          <div className="space-y-3">
            {showRejectForm ? (
              <div className="space-y-2">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t('rejectionPlaceholder')}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => reject.mutate()}
                    disabled={!rejectionReason.trim() || reject.isPending}
                    className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {reject.isPending ? t('rejecting') : t('confirmReject')}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    {tCommon('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending}
                  className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {approve.isPending ? t('approving') : t('approve')}
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  {t('reject')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
