import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

// Routes that require authentication
const protectedRoutes = ['/tree']

// Routes that should redirect to home if already authenticated
const authRoutes = ['/welcome/login', '/welcome/register']

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Verify token
  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(token, SECRET_KEY)
      isAuthenticated = true
    } catch (error) {
      // Token is invalid or expired
      isAuthenticated = false
    }
  }

  // Redirect logic
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login if trying to access protected route without auth
    return NextResponse.redirect(new URL('/welcome/login', request.url))
  }

  if (isAuthRoute && isAuthenticated) {
    // Redirect to home if trying to access auth pages while logged in
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
}
