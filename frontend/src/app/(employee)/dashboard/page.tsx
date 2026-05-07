'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Category, Expense } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { Drawer } from '@/components/drawer'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function EmployeeDashboardPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get<Expense[]>('/expenses').then((r) => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then((r) => r.data),
  })

  const submit = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('receipt', file!)
      form.append('selectedCategoryId', categoryId)
      if (description.trim()) form.append('employeeDescription', description.trim())
      return api.post('/expenses', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setDrawerOpen(false)
      setFile(null)
      setCategoryId('')
      setDescription('')
      setError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao enviar despesa.'
      setError(msg)
    },
  })

  function handleClose() {
    if (submit.isPending) return
    setDrawerOpen(false)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Minhas Despesas</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova Despesa
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : !data?.length ? (
        <p className="text-sm text-gray-500">Nenhuma despesa encontrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
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
              {data.map((expense: Expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <span className="block max-w-[220px] truncate" title={expense.originalFilename}>
                      {expense.originalFilename}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(expense.extractedAmount)}</td>
                  <td className="px-4 py-3">{formatDate(expense.extractedDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={expense.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="rounded-md border border-blue-500 px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={handleClose} title="Nova Despesa">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!file || !categoryId) return
            setError(null)
            submit.mutate()
          }}
          className="space-y-5"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">Comprovante</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400">JPG, PNG ou PDF — máx. 5 MB</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Categoria</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione uma categoria</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Descrição{' '}
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: almoço com cliente da empresa X"
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-right text-xs text-gray-400">{description.length}/500</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submit.isPending || !file || !categoryId}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submit.isPending ? 'Enviando…' : 'Enviar Despesa'}
          </button>
        </form>
      </Drawer>
    </div>
  )
}
