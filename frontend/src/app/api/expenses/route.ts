import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function GET(req: NextRequest) {
  const res = await backendFetch(`/expenses${req.nextUrl.search}`)
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? ''
  const isMultipart = contentType.includes('multipart/form-data')

  const body = isMultipart ? await req.formData() : await req.text()
  const headers: Record<string, string> = {}
  if (!isMultipart && contentType) headers['content-type'] = contentType

  const res = await backendFetch('/expenses', { method: 'POST', headers, body })
  return NextResponse.json(await res.json(), { status: res.status })
}
