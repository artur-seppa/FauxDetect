'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Category } from '@/lib/types'

export default function NewExpensePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then((r) => r.data),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !categoryId) return

    setError(null)
    setSubmitting(true)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('selectedCategoryId', categoryId)
      await api.post('/expenses', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao enviar despesa.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Nova Despesa</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !file || !categoryId}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Enviando…' : 'Enviar Despesa'}
        </button>
      </form>
    </div>
  )
}
