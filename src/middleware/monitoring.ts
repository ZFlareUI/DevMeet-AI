import { NextRequest, NextResponse } from 'next/server'
import { Analytics, PerformanceMonitor, ErrorLogger } from '@/lib/monitoring'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl

  // Skip monitoring for static assets and non-API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') && !pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  try {
    // Get session for user tracking
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Track page views for non-API routes
    if (!pathname.startsWith('/api')) {
      Analytics.trackPageView(pathname, userId)
    }

    // Continue with the request
    const response = NextResponse.next()

    // Measure response time after the request is processed
    const duration = Date.now() - startTime
    const statusCode = response.status

    // Track API performance for API routes
    if (pathname.startsWith('/api')) {
      PerformanceMonitor.trackAPIPerformance(
        pathname,
        request.method,
        duration,
        statusCode,
        userId
      )

      // Track API usage analytics
      Analytics.track('api_request', {
        route: pathname,
        method: request.method,
        statusCode,
        duration,
        userAgent: request.headers.get('user-agent'),
        ip: request.ip || request.headers.get('x-forwarded-for')
      }, userId)
    }

    // Log errors for 4xx and 5xx responses
    if (statusCode >= 400) {
      const errorMessage = statusCode >= 500 
        ? `Server error on ${pathname}` 
        : `Client error on ${pathname}`
      
      ErrorLogger.logError(
        errorMessage,
        {
          route: pathname,
          method: request.method,
          statusCode,
          duration,
          userAgent: request.headers.get('user-agent')
        },
        userId,
        statusCode >= 500 ? 'high' : 'medium'
      )
    }

    return response
  } catch (error) {
    // Log middleware errors
    ErrorLogger.logError(
      error instanceof Error ? error.message : 'Middleware error',
      {
        route: pathname,
        method: request.method,
        error: error instanceof Error ? error.stack : String(error)
      },
      undefined,
      'critical'
    )

    // Don't block the request even if monitoring fails
    return NextResponse.next()
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}