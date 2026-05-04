'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Expense, PaginatedResponse } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function EmployeeDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get<PaginatedResponse<Expense>>('/expenses').then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Minhas Despesas</h1>
        <Link
          href="/expenses/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova Despesa
        </Link>
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
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{expense.originalFilename}</td>
                  <td className="px-4 py-3">{formatCurrency(expense.extractedAmount)}</td>
                  <td className="px-4 py-3">{formatDate(expense.extractedDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={expense.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/expenses/${expense.id}`} className="text-blue-600 hover:underline">
                      Ver
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
