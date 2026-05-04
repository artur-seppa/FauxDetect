import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await backendFetch(`/expenses/${id}`)
  return NextResponse.json(await res.json(), { status: res.status })
}
