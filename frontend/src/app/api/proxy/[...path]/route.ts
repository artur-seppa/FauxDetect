import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND = process.env.API_URL ?? 'http://localhost:3333/api'

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  const { path } = await params
  const targetUrl = new URL(`${BACKEND}/${path.join('/')}${req.nextUrl.search}`)

  const isMultipart = req.headers.get('content-type')?.includes('multipart/form-data')

  const headers = new Headers()
  if (token) headers.set('authorization', `Bearer ${token}`)
  if (!isMultipart) {
    const ct = req.headers.get('content-type')
    if (ct) headers.set('content-type', ct)
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const body = hasBody ? (isMultipart ? await req.formData() : await req.text()) : undefined

  const res = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: body as BodyInit | undefined,
  })

  // Stream binary responses (e.g. CSV export) without parsing
  const contentType = res.headers.get('content-type') ?? 'application/json'
  const responseHeaders = new Headers()
  responseHeaders.set('content-type', contentType)

  const disposition = res.headers.get('content-disposition')
  if (disposition) responseHeaders.set('content-disposition', disposition)

  return new NextResponse(res.body, { status: res.status, headers: responseHeaders })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
