import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/api/auth'
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
  const { pathname } = request.nextUrl

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get the token from the request
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // If no token, redirect to signin
  if (!token) {
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