import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/auth/signin', 
  '/auth/register',
  '/landing',
  '/features',
  '/privacy',
  '/terms',
  '/api/auth/register',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/callback',
  '/api/auth/csrf',
]

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/analytics',
]

// Define API routes that require specific roles
const apiRoleRoutes = {
  '/api/candidates': ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
  '/api/interviews': ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
  '/api/assessments': ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
  '/api/uploads': ['ADMIN', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE'],
  '/api/analytics': ['ADMIN', 'RECRUITER'],
}

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Create response
  let response = NextResponse.next()
  
  // Add security headers to all responses
  response = addSecurityHeaders(response)
  
  // Skip middleware for public routes (except admin routes)
  const isPublicRoute = publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
  
  // Always check admin routes regardless of public status
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute && !isAdminRoute) {
    return response
  }
  
  // Get token for authentication
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  // If no token and route requires auth, redirect to signin
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: response.headers }
      )
    }
    
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // Check admin routes
  if (isAdminRoute) {
    const userRole = (token as any)?.role as UserRole
    if (userRole !== UserRole.ADMIN) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403, headers: response.headers }
        )
      }
      
      // Redirect to appropriate dashboard based on role
      const redirectUrl = getRoleBasedRedirect(userRole)
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
  }
  
  // Check API route permissions
  if (pathname.startsWith('/api/')) {
    const userRole = (token as any)?.role as UserRole
    
    // Check specific API route permissions
    for (const [route, allowedRoles] of Object.entries(apiRoleRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403, headers: response.headers }
          )
        }
        break
      }
    }
  }
  
  // Add user info to headers for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', (token as any)?.id || '')
    requestHeaders.set('x-user-role', (token as any)?.role || '')
    requestHeaders.set('x-user-email', (token as any)?.email || '')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return response
}

function getRoleBasedRedirect(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/dashboard'
    case UserRole.RECRUITER:
      return '/dashboard'
    case UserRole.INTERVIEWER:
      return '/interviews'
    case UserRole.CANDIDATE:
      return '/profile'
    default:
      return '/auth/signin'
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}