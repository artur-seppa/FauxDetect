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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{expense.originalFilename}</h1>
          <StatusBadge status={expense.status} />
        </div>
        <div className="flex items-center gap-2">
          {expense.fileUrl && (
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${expense.fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Ver Comprovante
            </a>
          )}
          <Link
            href="/hr/expenses"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-dashed border-gray-300 bg-gray-50 px-5 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Comprovante de Despesa</p>
          </div>
          <dl className="divide-y divide-dashed divide-gray-200 px-5 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Funcionário</dt>
              <dd className="font-medium">{expense.user?.fullName ?? '—'}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Fornecedor</dt>
              <dd className="font-medium">{expense.extractedVendor ?? '—'}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Data</dt>
              <dd>{formatDate(expense.extractedDate)}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Categoria</dt>
              <dd className="font-medium">{(expense.selectedCategory ?? expense.category)?.name ?? '—'}</dd>
            </div>
            {expense.extractedDescription && (
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-500">Descrição</dt>
                <dd className="max-w-[60%] text-right text-gray-700">{expense.extractedDescription}</dd>
              </div>
            )}
          </dl>
          <div className="border-t-2 border-dashed border-gray-300 bg-gray-50 px-5 py-3">
            <div className="flex justify-between text-sm font-bold text-gray-800">
              <span>TOTAL</span>
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
            <strong>Motivo da Rejeição:</strong> {expense.rejectionReason}
          </div>
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
    </div>
  )
}
