import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Role, User } from '@/lib/types'

const PUBLIC_ROUTES = ['/login']

const ROLE_HOME: Record<Role, string> = {
  employee: '/dashboard',
  hr: '/hr/dashboard',
  admin: '/hr/dashboard',
}

const EMPLOYEE_ROUTES = ['/dashboard', '/expenses']
const HR_ROUTES = ['/hr']

function getUserFromRequest(req: NextRequest): User | null {
  const raw = req.cookies.get('user')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

function isEmployeeRoute(pathname: string) {
  return EMPLOYEE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

function isHrRoute(pathname: string) {
  return HR_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('token')?.value
  const user = getUserFromRequest(req)

  // Allow public assets and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Unauthenticated → always redirect to login (except public routes)
  if (!token || !user) {
    if (isPublic(pathname)) return NextResponse.next()
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated user hitting /login → send to their home
  if (pathname === '/login') {
    const url = req.nextUrl.clone()
    url.pathname = ROLE_HOME[user.role]
    return NextResponse.redirect(url)
  }

  // Employee trying to access HR routes → redirect to their home
  if (user.role === 'employee' && isHrRoute(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = ROLE_HOME.employee
    return NextResponse.redirect(url)
  }

  // HR/admin trying to access employee-only routes → redirect to their home
  if ((user.role === 'hr' || user.role === 'admin') && isEmployeeRoute(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = ROLE_HOME[user.role]
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
