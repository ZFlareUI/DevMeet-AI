import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'
import { securityMiddleware } from '@/lib/security'

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; ')
}

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/': 60,
  '/auth/': 30,
  default: 100
}

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

// Simple in-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/api/auth',
  '/landing',
  '/features',
  '/privacy',
  '/terms'
]

// Define role-based route access
const roleBasedRoutes = {
  '/admin': ['ADMIN'],
  '/dashboard': ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
  '/interviews': ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
  '/candidates': ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
  '/analytics': ['ADMIN', 'RECRUITER'],
  '/api/candidates': ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
  '/api/interviews': ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
  '/api/assessments': ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
  '/api/analytics': ['ADMIN', 'RECRUITER']
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // CORS handling for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
  }
  
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'anonymous'
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()
  
  const limit = RATE_LIMITS[request.nextUrl.pathname as keyof typeof RATE_LIMITS] || RATE_LIMITS.default
  
  const current = rateLimitStore.get(key)
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
  } else if (current.count >= limit) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
          ...Object.fromEntries(Object.entries(securityHeaders))
        }
      }
    )
  } else {
    current.count++
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return response
  }

  // Get the token from the request
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // If no token, redirect to signin for pages or return 401 for API
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(Object.entries(securityHeaders))
          }
        }
      )
    }
    
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Check role-based access
  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route)) {
      const userRole = token.role as string
      if (!allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        const redirectUrl = getRoleBasedRedirect(userRole)
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
      break
    }
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', token.sub || '')
  requestHeaders.set('x-user-role', token.role as string || '')
  requestHeaders.set('x-user-email', token.email || '')

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

function getRoleBasedRedirect(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard'
    case 'RECRUITER':
      return '/dashboard'
    case 'INTERVIEWER':
      return '/interviews'
    case 'CANDIDATE':
      return '/candidate/profile'
    default:
      return '/auth/signin'
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}