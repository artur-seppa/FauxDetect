'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Expense } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { FraudSignalsCard } from '@/components/fraud-signals-card'
import { CategoryMatchBadge } from '@/components/category-match-badge'
import { FileViewer } from '@/components/file-viewer'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function HrExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

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

  if (isLoading) return <p className="text-sm text-gray-500">Carregando…</p>
  if (!expense) return <p className="text-sm text-red-500">Despesa não encontrada.</p>

  const canReview = expense.status === 'pending' || expense.status === 'manual_review'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hr/expenses" className="text-sm text-blue-600 hover:underline">
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
                <dt className="text-gray-500">Funcionário</dt>
                <dd className="font-medium">{expense.user?.name ?? '—'}</dd>
              </div>
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

          {canReview && (
            <div className="space-y-3">
              {showRejectForm ? (
                <div className="space-y-2">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Motivo da rejeição…"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => reject.mutate()}
                      disabled={!rejectionReason.trim() || reject.isPending}
                      className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {reject.isPending ? 'Rejeitando…' : 'Confirmar Rejeição'}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
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
                    {approve.isPending ? 'Aprovando…' : 'Aprovar'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Rejeitar
                  </button>
                </div>
              )}
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
