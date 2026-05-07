'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrency, parseKeywords } from '@/lib/utils'
import type { Category } from '@/lib/types'
import { Drawer } from '@/components/drawer'
import { ConfirmModal } from '@/components/confirm-modal'
import { Skeleton } from '@/components/ui/skeleton'

type FormData = {
  name: string
  maxAmount?: string
  keywords?: string
}

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const t = useTranslations('categories')
  const tCommon = useTranslations('common')

  const schema = z.object({
    name: z.string().min(1, t('form.nameRequired')),
    maxAmount: z.string().optional(),
    keywords: z.string().optional(),
  })
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
  const drawerTitle = editTarget === 'new' ? t('newCategory') : t('editCategory')

  const tableHead = (
    <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
      <tr>
        <th className="px-4 py-3">{t('columns.name')}</th>
        <th className="px-4 py-3">{t('columns.keywords')}</th>
        <th className="px-4 py-3">{t('columns.limit')}</th>
        <th className="px-4 py-3">{t('columns.status')}</th>
        <th className="px-4 py-3"></th>
      </tr>
    </thead>
  )

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <button
            onClick={openCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t('newCategory')}
          </button>
        </div>

        {isLoading ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-[560px] text-sm">
              {tableHead}
              <tbody className="divide-y divide-gray-100">
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><div className="flex gap-1"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-12 rounded-full" /></div></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-2"><Skeleton className="h-7 w-14 rounded-md" /><Skeleton className="h-7 w-14 rounded-md" /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !categories.length ? (
          <p className="text-sm text-gray-500">{t('empty')}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                {tableHead}
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
                          {category.active ? t('active') : t('inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(category)}
                            className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-blue-600 ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(category)}
                            className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-300 hover:bg-red-50"
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Drawer open={editTarget !== null} onClose={closeDrawer} title={drawerTitle}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="category-name" className="text-sm font-medium text-gray-700">{t('form.name')}</label>
            <input
              id="category-name"
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="category-keywords" className="text-sm font-medium text-gray-700">{t('form.keywords')}</label>
            <input
              id="category-keywords"
              {...register('keywords')}
              placeholder="restaurant, food, lunch"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="text-xs text-gray-400">{t('form.keywordsHint')}</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="category-max-amount" className="text-sm font-medium text-gray-700">{t('form.limit')}</label>
            <input
              id="category-max-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="—"
              {...register('maxAmount')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="text-xs text-gray-400">{t('form.limitHint')}</p>
          </div>

          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {t('form.saveError')}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {isSubmitting ? tCommon('saving') : tCommon('save')}
            </button>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {tCommon('cancel')}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmModal
        open={deleteTarget !== null}
        title={t('deleteModal.title')}
        description={deleteTarget ? t('deleteModal.description', { name: deleteTarget.name }) : ''}
        confirmLabel={deleteMutation.isPending ? t('deleteModal.deleting') : t('deleteModal.confirm')}
        cancelLabel={tCommon('cancel')}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
