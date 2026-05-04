import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET() {
  const res = await backendFetch('/hr/export/csv')

  const headers = new Headers()
  headers.set('content-type', res.headers.get('content-type') ?? 'text/csv')
  const disposition = res.headers.get('content-disposition')
  if (disposition) headers.set('content-disposition', disposition)

  return new NextResponse(res.body, { status: res.status, headers })
}
