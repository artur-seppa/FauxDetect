import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Role } from '@/lib/types'
import type { UserInfo } from '@/hooks/use-auth'

const PUBLIC_ROUTES = ['/login', '/api/auth/session']

const ROLE_HOME: Record<Role, string> = {
  employee: '/dashboard',
  hr: '/hr/dashboard',
  admin: '/hr/dashboard',
}

const EMPLOYEE_ROUTES = ['/dashboard', '/expenses']
const HR_ROUTES = ['/hr']

function getUserInfo(req: NextRequest): UserInfo | null {
  const raw = req.cookies.get('user_info')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserInfo
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

  // Always allow public routes and BFF proxy internals
  if (isPublic(pathname) || pathname.startsWith('/api/proxy')) {
    return NextResponse.next()
  }

  const token = req.cookies.get('token')?.value
  const user = getUserInfo(req)

  // Unauthenticated → redirect to login
  if (!token || !user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated hitting /login → send to role home
  if (pathname === '/login') {
    const url = req.nextUrl.clone()
    url.pathname = ROLE_HOME[user.role]
    return NextResponse.redirect(url)
  }

  // Role isolation: employee cannot access HR routes
  if (user.role === 'employee' && isHrRoute(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = ROLE_HOME.employee
    return NextResponse.redirect(url)
  }

  // Role isolation: HR/admin cannot access employee routes
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
