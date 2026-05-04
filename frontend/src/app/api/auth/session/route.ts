import { NextRequest, NextResponse } from 'next/server'
import type { AuthResponse } from '@/lib/types'

const BACKEND = process.env.API_URL ?? 'http://localhost:3333/api'

const COOKIE_OPTS = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Credenciais inválidas.' }))
    return NextResponse.json(error, { status: res.status })
  }

  const data: AuthResponse = await res.json()

  const response = NextResponse.json({ user: data.user })

  // Token httpOnly — inacessível ao JavaScript do browser
  response.cookies.set('token', data.token, {
    ...COOKIE_OPTS,
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  // user_info não httpOnly — apenas dados de exibição (nome, role)
  response.cookies.set(
    'user_info',
    JSON.stringify({ id: data.user.id, name: data.user.name, role: data.user.role }),
    { ...COOKIE_OPTS, httpOnly: false, maxAge: 60 * 60 * 24 * 7 }
  )

  return response
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  if (token) {
    await fetch(`${BACKEND}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null)
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('token')
  response.cookies.delete('user_info')
  return response
}
