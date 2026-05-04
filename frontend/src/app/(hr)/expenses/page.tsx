'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Expense, PaginatedResponse } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'manual_review', label: 'Revisão Manual' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
]

export default function HrExpensesPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') ?? ''

  const { data, isLoading } = useQuery({
    queryKey: ['hr-expenses', status],
    queryFn: () =>
      api
        .get<PaginatedResponse<Expense>>('/expenses', { params: { status: status || undefined } })
        .then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Despesas</h1>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/hr/export/csv`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Exportar CSV
        </a>
      </div>

      <div className="flex gap-2">
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
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : !data?.data.length ? (
        <p className="text-sm text-gray-500">Nenhuma despesa encontrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Funcionário</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{expense.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{expense.originalFilename}</td>
                  <td className="px-4 py-3">{formatCurrency(expense.extractedAmount)}</td>
                  <td className="px-4 py-3">{formatDate(expense.extractedDate)}</td>
                  <td className="px-4 py-3">{expense.category?.name ?? '—'}</td>
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
                    <Link href={`/hr/expenses/${expense.id}`} className="text-blue-600 hover:underline">
                      Revisar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
