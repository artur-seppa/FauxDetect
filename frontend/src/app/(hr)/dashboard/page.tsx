'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { HrDashboard } from '@/lib/types'

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

export default function HrDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['hr-dashboard'],
    queryFn: () => api.get<HrDashboard>('/hr/dashboard').then((r) => r.data),
  })

  if (isLoading) return <p className="text-sm text-gray-500">Carregando…</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard RH</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pendentes" value={data?.pending ?? 0} href="/hr/expenses?status=pending" />
        <StatCard label="Em Revisão" value={data?.manualReview ?? 0} href="/hr/expenses?status=manual_review" />
        <StatCard label="Aprovados Hoje" value={data?.approvedToday ?? 0} href="/hr/expenses?status=approved" />
        <StatCard label="Rejeitados Hoje" value={data?.rejectedToday ?? 0} href="/hr/expenses?status=rejected" />
      </div>
    </div>
  )
}
