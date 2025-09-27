import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-enhanced'

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: {
      status: 'healthy' | 'unhealthy'
      responseTime?: number
      error?: string
    }
    redis?: {
      status: 'healthy' | 'unhealthy'
      responseTime?: number
      error?: string
    }
    ai: {
      status: 'healthy' | 'unhealthy'
      responseTime?: number
      error?: string
    }
    storage: {
      status: 'healthy' | 'unhealthy'
      responseTime?: number
      error?: string
    }
  }
  metrics: {
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage?: NodeJS.CpuUsage
  }
}

async function checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
  try {
    const start = Date.now()
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      return { 
        status: 'unhealthy', 
        error: 'DATABASE_URL environment variable not found' 
      }
    }
    
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start
    return { status: 'healthy', responseTime }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

async function checkRedis(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
  try {
    // If Redis is configured, check it
    if (process.env.REDIS_URL) {
      const start = Date.now()
      // Add Redis ping check here if Redis client is available
      const responseTime = Date.now() - start
      return { status: 'healthy', responseTime }
    }
    return { status: 'healthy', responseTime: 0 }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown Redis error'
    }
  }
}

async function checkAI(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
  try {
    const start = Date.now()
    
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return { status: 'unhealthy', error: 'Gemini API key not configured' }
    }
    
    // Simple check - we could do a lightweight API call here
    const responseTime = Date.now() - start
    return { status: 'healthy', responseTime }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown AI service error'
    }
  }
}

async function checkStorage(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
  try {
    const start = Date.now()
    const fs = await import('fs/promises')
    
    // Check if upload directory exists and is writable
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    try {
      await fs.access(uploadDir, fs.constants.F_OK | fs.constants.W_OK)
    } catch {
      // Try to create the directory if it doesn't exist
      await fs.mkdir(uploadDir, { recursive: true })
    }
    
    const responseTime = Date.now() - start
    return { status: 'healthy', responseTime }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown storage error'
    }
  }
}

export async function GET(_request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Run all health checks in parallel
    const [database, redis, ai, storage] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkAI(),
      checkStorage()
    ])

    // Determine overall health status
    const allChecks = [database, ai, storage]
    if (redis.status) allChecks.push(redis)
    
    const isHealthy = allChecks.every(check => check.status === 'healthy')
    
    // Get system metrics
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    const result: HealthCheckResult = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database,
        redis: redis.status ? redis : undefined,
        ai,
        storage
      },
      metrics: {
        memoryUsage,
        cpuUsage
      }
    }

    const statusCode = isHealthy ? 200 : 503
    const responseTime = Date.now() - startTime

    // Add response time to headers
    const headers = new Headers()
    headers.set('X-Response-Time', `${responseTime}ms`)
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    return NextResponse.json(result, { 
      status: statusCode,
      headers
    })

  } catch (_error) {
    const result: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'unhealthy', error: 'Health check failed' },
        ai: { status: 'unhealthy', error: 'Health check failed' },
        storage: { status: 'unhealthy', error: 'Health check failed' }
      },
      metrics: {
        memoryUsage: process.memoryUsage()
      }
    }

    return NextResponse.json(result, { status: 503 })
  }
}

// Simple health check endpoint for load balancers
export async function HEAD(_request: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}