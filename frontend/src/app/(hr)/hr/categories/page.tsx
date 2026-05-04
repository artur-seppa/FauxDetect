'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Category } from '@/lib/types'
import { Drawer } from '@/components/drawer'
import { ConfirmModal } from '@/components/confirm-modal'

const schema = z.object({
  name: z.string().min(1, { error: 'Nome obrigatório' }),
  maxAmount: z.string().optional(),
  keywords: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function parseKeywords(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<'new' | Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

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
    mutationFn: (data: { name: string; maxAmount: number | null; keywords: string[] }) =>
      api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeDrawer()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number
      name: string
      maxAmount: number | null
      active: boolean
      keywords: string[]
    }) => api.put(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeDrawer()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleteTarget(null)
    },
  })

  function openCreate() {
    reset({ name: '', maxAmount: '', keywords: '' })
    setEditTarget('new')
  }

  function openEdit(category: Category) {
    reset({
      name: category.name,
      maxAmount: category.maxAmount != null ? String(category.maxAmount) : '',
      keywords: category.keywords?.join(', ') ?? '',
    })
    setEditTarget(category)
  }

  function closeDrawer() {
    setEditTarget(null)
    reset()
  }

  async function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      maxAmount: data.maxAmount ? Number(data.maxAmount) : null,
      keywords: parseKeywords(data.keywords),
    }
    if (editTarget === 'new') {
      await createMutation.mutateAsync(payload)
    } else if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget.id, ...payload, active: editTarget.active })
    }
  }

  function toggleActive(category: Category) {
    updateMutation.mutate({
      id: category.id,
      name: category.name,
      maxAmount: category.maxAmount,
      active: !category.active,
      keywords: category.keywords ?? [],
    })
  }

  const saveError = createMutation.error ?? updateMutation.error
  const drawerTitle = editTarget === 'new' ? 'Nova Categoria' : 'Editar Categoria'

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Categorias</h1>
          <button
            onClick={openCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Nova Categoria
          </button>
        </div>

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
                  <th className="px-4 py-3">Keywords</th>
                  <th className="px-4 py-3">Limite</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3">
                      {category.keywords?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {category.keywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(category)}
                          className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-blue-600 ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(category)}
                          className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-300 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer open={editTarget !== null} onClose={closeDrawer} title={drawerTitle}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Keywords</label>
            <input
              {...register('keywords')}
              placeholder="restaurante, comida, almoço"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="text-xs text-gray-400">Separe as keywords por vírgula.</p>
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
            <p className="text-xs text-gray-400">Deixe em branco para sem limite.</p>
          </div>

          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Ocorreu um erro ao salvar. Tente novamente.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Excluir categoria"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
