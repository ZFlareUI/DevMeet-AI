import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// Simple rate limiter implementation
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  constructor(private maxRequests: number, private windowMs: number) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Remove expired requests
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      this.requests.set(key, validRequests)
      return false
    }
    
    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }
}

// Rate limiting instances
const rateLimiters = {
  auth: new SimpleRateLimiter(5, 60000), // 5 requests per minute
  api: new SimpleRateLimiter(100, 60000), // 100 requests per minute
  upload: new SimpleRateLimiter(10, 60000), // 10 requests per minute
  sensitive: new SimpleRateLimiter(3, 60000) // 3 requests per minute
}

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; child-src 'none'; worker-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';"
}

// Rate limit configurations by endpoint type
const rateLimitConfigs = {
  auth: { tokensPerInterval: 5, interval: 60000 }, // 5 requests per minute
  api: { tokensPerInterval: 100, interval: 60000 }, // 100 requests per minute
  upload: { tokensPerInterval: 10, interval: 60000 }, // 10 requests per minute
  sensitive: { tokensPerInterval: 3, interval: 60000 } // 3 requests per minute
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = forwarded?.split(',')[0] || realIP || 'unknown'
  return clientIP
}

// Get rate limiter for endpoint type
function getRateLimiter(type: keyof typeof rateLimitConfigs): SimpleRateLimiter {
  const config = rateLimitConfigs[type]
  return rateLimiters[type]
}

// Determine endpoint type for rate limiting
function getEndpointType(pathname: string): keyof typeof rateLimitConfigs {
  if (pathname.includes('/auth/')) return 'auth'
  if (pathname.includes('/upload')) return 'upload'
  if (pathname.includes('/admin') || pathname.includes('/analytics')) return 'sensitive'
  return 'api'
}

// Log security event
async function logSecurityEvent(event: {
  type: 'rate_limit' | 'auth_failure' | 'suspicious_activity' | 'access_denied'
  ip: string
  userAgent: string
  path: string
  userId?: string
  details?: Record<string, any>
}) {
  try {
    await prisma.securityLog.create({
      data: {
        type: event.type,
        ip: event.ip,
        userAgent: event.userAgent,
        path: event.path,
        userId: event.userId,
        details: JSON.stringify(event.details || {}),
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// Check for suspicious patterns
function detectSuspiciousActivity(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const path = request.nextUrl.pathname
  
  // Common attack patterns
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /eval\(/i, // Code injection
    /document\.cookie/i, // Cookie theft
    /\/proc\/self\/environ/i, // System file access
    /etc\/passwd/i, // System file access
    /cmd\.exe/i, // Command injection
    /powershell/i, // PowerShell injection
  ]
  
  // Check URL and headers for suspicious patterns
  const fullUrl = request.url
  const suspiciousInUrl = suspiciousPatterns.some(pattern => pattern.test(fullUrl))
  const suspiciousInUA = userAgent.length === 0 || userAgent.length > 1000
  
  return suspiciousInUrl || suspiciousInUA
}

// Rate limiting middleware
export async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIP(request)
  const pathname = request.nextUrl.pathname
  const endpointType = getEndpointType(pathname)
  
  // Get rate limiter for this endpoint type
  const rateLimiter = getRateLimiter(endpointType)
  
  // Check if request is allowed
  const allowed = rateLimiter.isAllowed(`${ip}:${endpointType}`)
  
  if (!allowed) {
    // Log rate limit violation
    await logSecurityEvent({
      type: 'rate_limit',
      ip,
      userAgent: request.headers.get('user-agent') || '',
      path: pathname,
      details: { endpointType, limit: rateLimitConfigs[endpointType] }
    })
    
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }
  
  return null
}

// Authentication middleware
export async function requireAuth(request: NextRequest, roles?: string[]): Promise<NextResponse | null> {
  const token = await getToken({ req: request })
  const ip = getClientIP(request)
  const pathname = request.nextUrl.pathname
  
  if (!token) {
    await logSecurityEvent({
      type: 'auth_failure',
      ip,
      userAgent: request.headers.get('user-agent') || '',
      path: pathname,
      details: { reason: 'no_token' }
    })
    
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  // Check role-based access
  if (roles && roles.length > 0) {
    const userRole = (token as any).role as string
    if (!roles.includes(userRole)) {
      await logSecurityEvent({
        type: 'access_denied',
        ip,
        userAgent: request.headers.get('user-agent') || '',
        path: pathname,
        userId: (token as any).id as string,
        details: { userRole, requiredRoles: roles }
      })
      
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
  }
  
  return null
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value)
  })
  
  return response
}

// Suspicious activity detection middleware
export async function detectAndLogSuspiciousActivity(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIP(request)
  const pathname = request.nextUrl.pathname
  const userAgent = request.headers.get('user-agent') || ''
  
  if (detectSuspiciousActivity(request)) {
    await logSecurityEvent({
      type: 'suspicious_activity',
      ip,
      userAgent,
      path: pathname,
      details: { url: request.url, method: request.method }
    })
    
    // Block suspicious requests
    return NextResponse.json(
      { error: 'Request blocked' },
      { status: 400 }
    )
  }
  
  return null
}

// Audit trail middleware
export async function auditTrail(request: NextRequest, userId?: string, action?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: action || `${request.method} ${request.nextUrl.pathname}`,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        timestamp: new Date(),
        details: JSON.stringify({
          method: request.method,
          path: request.nextUrl.pathname,
          query: Object.fromEntries(request.nextUrl.searchParams)
        })
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

// Main security middleware function
export async function securityMiddleware(request: NextRequest): Promise<NextResponse> {
  // Apply security checks
  const suspiciousCheck = await detectAndLogSuspiciousActivity(request)
  if (suspiciousCheck) return suspiciousCheck
  
  const rateLimitCheck = await applyRateLimit(request)
  if (rateLimitCheck) return rateLimitCheck
  
  // Continue to next middleware/handler
  const response = NextResponse.next()
  
  // Add security headers to response
  return addSecurityHeaders(response)
}

// Helper function to protect API routes
export function createProtectedHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    roles?: string[]
    auditAction?: string
  } = {}
) {
  return async (request: NextRequest, context?: any) => {
    try {
      // Apply security middleware
      const securityResponse = await securityMiddleware(request)
      if (securityResponse.status !== 200) {
        return securityResponse
      }
      
      // Apply authentication if required
      if (options.requireAuth) {
        const authResponse = await requireAuth(request, options.roles)
        if (authResponse) return authResponse
      }
      
      // Get user info for audit trail
      let userId: string | undefined
      if (options.requireAuth) {
        const token = await getToken({ req: request })
        userId = (token as any)?.id as string
      }
      
      // Create audit trail
      if (options.auditAction) {
        await auditTrail(request, userId, options.auditAction)
      }
      
      // Execute the actual handler
      const response = await handler(request, context)
      
      // Add security headers
      return addSecurityHeaders(response)
      
    } catch (error) {
      console.error('Security middleware error:', error)
      
      // Log the error
      await logSecurityEvent({
        type: 'suspicious_activity',
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        path: request.nextUrl.pathname,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}