'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Expense } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { FraudSignalsCard } from '@/components/fraud-signals-card'
import { CategoryMatchBadge } from '@/components/category-match-badge'
import { FileViewer } from '@/components/file-viewer'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => api.get<Expense>(`/expenses/${id}`).then((r) => r.data),
  })

  if (isLoading) return <p className="text-sm text-gray-500">Carregando…</p>
  if (!expense) return <p className="text-sm text-red-500">Despesa não encontrada.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold">{expense.originalFilename}</h1>
        <StatusBadge status={expense.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 font-semibold">Dados Extraídos</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Valor</dt>
                <dd className="font-medium">{formatCurrency(expense.extractedAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Data</dt>
                <dd>{formatDate(expense.extractedDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Fornecedor</dt>
                <dd>{expense.extractedVendor ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Descrição</dt>
                <dd className="max-w-[60%] text-right">{expense.extractedDescription ?? '—'}</dd>
              </div>
            </dl>
          </div>

          <CategoryMatchBadge match={expense.categoryMatch} categoryName={expense.category?.name} />

          {expense.fraudSignals && (
            <FraudSignalsCard signals={expense.fraudSignals} fraudScore={expense.fraudScore} />
          )}

          {expense.rejectionReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <strong>Motivo da Rejeição:</strong> {expense.rejectionReason}
            </div>
          )}
        </div>

        <FileViewer
          url={`${process.env.NEXT_PUBLIC_API_URL}/expenses/${expense.id}/file`}
          filename={expense.originalFilename}
        />
      </div>
    </div>
  )
}
