import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await backendFetch(`/expenses/${id}/file`)

  const headers = new Headers()
  headers.set('content-type', res.headers.get('content-type') ?? 'application/octet-stream')
  const disposition = res.headers.get('content-disposition')
  if (disposition) headers.set('content-disposition', disposition)

  return new NextResponse(res.body, { status: res.status, headers })
}
