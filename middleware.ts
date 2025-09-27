import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'
import { limiter } from '@/lib/rate-limit'
import { verifyJWT } from '@/lib/jwt'

interface AuthToken {
  id?: string
  role?: UserRole
  organizationId?: string
  email?: string
  name?: string
}

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

// Security headers with enhanced CSP
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.vercel-insights.com https://*.sentry.io",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'X-DNS-Prefetch-Control': 'on'
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

// Rate limiting configuration
const RATE_LIMIT = {
  public: 100, // requests per minute for public routes
  auth: 30,    // requests per minute for authenticated routes
  api: 60      // requests per minute for API routes
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Get IP from headers or default to localhost
  const ip = (request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim()
  
  // Create response with security headers
  let response = NextResponse.next()
  response = addSecurityHeaders(response)
  
  // Apply rate limiting
  const isApiRoute = pathname.startsWith('/api/')
  const isAuthRoute = pathname.startsWith('/auth/')
  
  const rateLimitKey = isApiRoute ? 'api' : isAuthRoute ? 'auth' : 'public'
  const { isRateLimited, response: rateLimitResponse } = limiter.check(
    request, 
    RATE_LIMIT[rateLimitKey],
    isApiRoute ? `${ip}-${pathname}` : ip
  )
  
  if (isRateLimited && rateLimitResponse) {
    return rateLimitResponse
  }
  
  // Skip middleware for public routes (except admin routes)
  const isPublicRoute = publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
  
  // Add CORS headers for API routes
  if (isApiRoute) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 200, 
        headers: Object.fromEntries(response.headers) 
      })
    }
  }
  
  // Always check admin routes regardless of public status
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute && !isAdminRoute) {
    return response
  }
  
  // Get token for authentication with enhanced security
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    cookieName: process.env.NEXTAUTH_COOKIE_NAME || '__Secure-next-auth.session-token',
    decode: async ({ secret, token }) => {
      if (!token) return null
      try {
        // Verify and decode token with additional security checks
        // @ts-ignore - Type mismatch between next-auth and jwt library
        return await verifyJWT(token as any, secret, {
          algorithms: ['HS256'],
          maxAge: process.env.NEXTAUTH_JWT_EXPIRES_IN || '30d',
          clockTolerance: 15, // 15 seconds clock tolerance
          ignoreExpiration: false,
        })
      } catch (error) {
        console.error('JWT verification failed:', error)
        return null
      }
    }
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
    const userRole = (token as AuthToken)?.role
    if (!userRole || userRole !== UserRole.ADMIN) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403, headers: response.headers }
        )
      }
      
      // Redirect to appropriate dashboard based on role
      const redirectUrl = getRoleBasedRedirect(userRole || UserRole.CANDIDATE)
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
  }
  
  // Check API route permissions
  if (pathname.startsWith('/api/')) {
    const userRole = (token as AuthToken)?.role
    
    // Check specific API route permissions
    for (const [route, allowedRoles] of Object.entries(apiRoleRoutes)) {
      if (pathname.startsWith(route)) {
        if (!userRole || !allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403, headers: response.headers }
          )
        }
        break
      }
    }
  }
  
  // Add security headers and user info to API responses
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    
    // Add user context to headers
    if (token) {
      requestHeaders.set('x-user-id', (token as AuthToken)?.id || '')
      requestHeaders.set('x-user-role', (token as AuthToken)?.role || '')
      requestHeaders.set('x-user-email', (token as AuthToken)?.email || '')
    }
    
    // Add security headers
    requestHeaders.set('X-Request-ID', crypto.randomUUID())
    
    // Prevent MIME type sniffing
    requestHeaders.set('X-Content-Type-Options', 'nosniff')
    
    // Add HSTS header for HTTPS
    if (process.env.NODE_ENV === 'production') {
      requestHeaders.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    }
    
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