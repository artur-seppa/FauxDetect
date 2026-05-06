'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { api } from '@/lib/api'
import type { HrDashboard } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  manual_review: 'Em Revisão',
  processing: 'Processando',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  manual_review: '#eab308',
  processing: '#6b7280',
}

const TEAL = '#0d9488'
const RED = '#ef4444'

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-gray-700">{title}</h2>
      {children}
    </div>
  )
}

export default function HrDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['hr-dashboard'],
    queryFn: () => api.get<HrDashboard>('/hr/dashboard').then((r) => r.data),
  })

  if (isLoading) return <p className="text-sm text-gray-500">Carregando…</p>

  const statusData = (data?.statusDistribution ?? []).map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.total,
    fill: STATUS_COLORS[s.status] ?? '#6b7280',
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard RH</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pendentes" value={data?.pending ?? 0} href="/hr/expenses?status=pending" />
        <StatCard label="Em Revisão" value={data?.manualReview ?? 0} href="/hr/expenses?status=manual_review" />
        <StatCard label="Aprovados Hoje" value={data?.approvedToday ?? 0} href="/hr/expenses?status=approved" />
        <StatCard label="Rejeitados Hoje" value={data?.rejectedToday ?? 0} href="/hr/expenses?status=rejected" />
      </div>

      <ChartCard title="Despesas nos últimos 30 dias">
        <div className="h-40 sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.expensesByDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip labelFormatter={(v) => `Data: ${v}`} formatter={(v) => [v, 'Despesas']} />
              <Line type="monotone" dataKey="total" stroke={TEAL} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Despesas por colaborador">
          <div className="h-52 sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.expensesByUser ?? []}
                layout="vertical"
                margin={{ left: 4, right: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [v, 'Despesas']} />
                <Bar dataKey="total" fill={TEAL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Distribuição de status">
          <div className="h-52 sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius="55%"
                  innerRadius="30%"
                />
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Sinais de fraude detectados">
        <div className="h-44 sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.fraudSignalCounts ?? []} margin={{ bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="signal"
                tick={{ fontSize: 10 }}
                angle={-20}
                textAnchor="end"
                height={54}
                interval={0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v) => [v, 'Ocorrências']} />
              <Bar dataKey="total" fill={RED} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
