import { cookies } from 'next/headers'

const BACKEND = process.env.API_URL ?? 'http://localhost:3333/api'

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  const headers = new Headers(init?.headers)
  if (token) headers.set('authorization', `Bearer ${token}`)

  return fetch(`${BACKEND}${path}`, { ...init, headers })
}
