'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import type { Expense } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function HrExpensesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const status = searchParams.get('status') ?? ''
  const t = useTranslations('hrExpenses')
  const tStatus = useTranslations('status')

  const STATUS_OPTIONS = [
    { value: '', label: t('filterAll') },
    { value: 'pending', label: tStatus('pending') },
    { value: 'manual_review', label: tStatus('manual_review') },
    { value: 'approved', label: tStatus('approved') },
    { value: 'rejected', label: tStatus('rejected') },
  ]

  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['hr-expenses', status],
    queryFn: () =>
      api
        .get<Expense[]>('/expenses', { params: { status: status || undefined } })
        .then((r) => r.data),
  })

  const tableHead = (
    <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
      <tr>
        <th className="px-4 py-3">{t('columns.employee')}</th>
        <th className="px-4 py-3">{t('columns.file')}</th>
        <th className="px-4 py-3">{t('columns.amount')}</th>
        <th className="px-4 py-3">{t('columns.date')}</th>
        <th className="px-4 py-3">{t('columns.category')}</th>
        <th className="px-4 py-3">{t('columns.score')}</th>
        <th className="px-4 py-3">{t('columns.status')}</th>
        <th className="px-4 py-3"></th>
      </tr>
    </thead>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('title')}</h1>

      {/* mobile: custom dropdown */}
      <div className="relative sm:hidden" ref={filterRef}>
        <button
          onClick={() => setFilterOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 shadow-sm"
        >
          <span>{STATUS_OPTIONS.find((o) => o.value === status)?.label}</span>
          <svg
            className={`ml-2 h-3 w-3 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {filterOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  router.push(opt.value ? `/hr/expenses?status=${opt.value}` : '/hr/expenses')
                  setFilterOpen(false)
                }}
                className={`w-full px-4 py-2 text-left text-xs transition-colors hover:bg-gray-50 ${
                  status === opt.value ? 'font-semibold text-blue-600' : 'text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* desktop: pill buttons */}
      <div className="hidden sm:flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/hr/expenses?status=${opt.value}` : '/hr/expenses'}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              {tableHead}
              <tbody className="divide-y divide-gray-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="ml-auto h-6 w-14 rounded-lg" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !data?.length ? (
        <p className="text-sm text-gray-500">{t('empty')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              {tableHead}
              <tbody className="divide-y divide-gray-100">
                {(data ?? []).map((expense: Expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{expense.user?.fullName ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">
                      <span className="block max-w-[220px] truncate" title={expense.originalFilename}>
                        {expense.originalFilename}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(expense.extractedAmount)}</td>
                    <td className="px-4 py-3">{formatDate(expense.extractedDate)}</td>
                    <td className="px-4 py-3">{(expense.selectedCategory ?? expense.category)?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          expense.fraudScore >= 70
                            ? 'font-bold text-red-600'
                            : expense.fraudScore >= 40
                              ? 'font-bold text-yellow-600'
                              : 'text-green-600'
                        }
                      >
                        {expense.fraudScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={expense.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => router.push(`/hr/expenses/${expense.id}`)}
                        className="rounded-lg border border-emerald-600 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        {t('review')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
