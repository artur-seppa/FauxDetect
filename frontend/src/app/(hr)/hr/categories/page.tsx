'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Category } from '@/lib/types'

const schema = z.object({
  name: z.string().min(1, { error: 'Nome obrigatório' }),
  maxAmount: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type EditTarget = 'new' | number

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; maxAmount: number | null }) =>
      api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      reset()
      setEditTarget(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; name: string; maxAmount: number | null; active: boolean }) =>
      api.put(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      reset()
      setEditTarget(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  function openCreate() {
    reset({ name: '', maxAmount: '' })
    setEditTarget('new')
  }

  function openEdit(category: Category) {
    reset({
      name: category.name,
      maxAmount: category.maxAmount != null ? String(category.maxAmount) : '',
    })
    setEditTarget(category.id)
  }

  function cancelForm() {
    setEditTarget(null)
    reset()
  }

  async function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      maxAmount: data.maxAmount ? Number(data.maxAmount) : null,
    }
    if (editTarget === 'new') {
      await createMutation.mutateAsync(payload)
    } else if (typeof editTarget === 'number') {
      const existing = categories.find((c) => c.id === editTarget)!
      await updateMutation.mutateAsync({ id: editTarget, ...payload, active: existing.active })
    }
  }

  function toggleActive(category: Category) {
    updateMutation.mutate({
      id: category.id,
      name: category.name,
      maxAmount: category.maxAmount,
      active: !category.active,
    })
  }

  function handleDelete(category: Category) {
    if (!confirm(`Excluir a categoria "${category.name}"?`)) return
    deleteMutation.mutate(category.id)
  }

  const showForm = editTarget !== null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categorias</h1>
        {!showForm && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Nova Categoria
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
        >
          <h2 className="text-sm font-medium text-gray-700">
            {editTarget === 'new' ? 'Nova Categoria' : 'Editar Categoria'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <input
                {...register('name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Limite (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Sem limite"
                {...register('maxAmount')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : !categories.length ? (
        <p className="text-sm text-gray-500">Nenhuma categoria cadastrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Limite</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3">{formatCurrency(category.maxAmount)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(category)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                        category.active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {category.active ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(category)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <span className="mx-2 text-gray-300">|</span>
                    <button
                      onClick={() => handleDelete(category)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Excluir
                    </button>
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
