import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Analytics, AnalyticsDashboard, PerformanceMonitor, ErrorLogger, HealthChecker } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'INTERVIEWER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'
    const limit = parseInt(searchParams.get('limit') || '100')
    const userId = searchParams.get('userId')

    // Track analytics access
    Analytics.track('analytics_accessed', {
      type,
      userId: session.user.id,
      role: session.user.role
    }, session.user.id)

    switch (type) {
      case 'dashboard':
        // Get comprehensive dashboard data from monitoring system
        const monitoringDashboard = AnalyticsDashboard.getDashboardData()
        
        // Get basic database counts
        const [
          totalCandidates,
          totalInterviews,
          completedInterviews,
          recentCandidates,
          recentInterviews
        ] = await Promise.all([
          prisma.candidate.count(),
          prisma.interview.count(),
          prisma.interview.count({ where: { status: 'COMPLETED' } }),
          prisma.candidate.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              position: true,
              status: true,
              createdAt: true
            }
          }),
          prisma.interview.findMany({
            take: 5,
            orderBy: { scheduledAt: 'desc' },
            include: {
              candidate: {
                select: { name: true }
              }
            }
          })
        ])

        const completionRate = totalInterviews > 0 ? (completedInterviews / totalInterviews) * 100 : 0

        PerformanceMonitor.trackAPIPerformance(request.url, 'GET', Date.now() - startTime, 200, session.user.id)
        
        return NextResponse.json({
          database: {
            totalCandidates,
            totalInterviews,
            completedInterviews,
            completionRate: Math.round(completionRate * 100) / 100,
            recentCandidates,
            recentInterviews
          },
          monitoring: monitoringDashboard
        })

      case 'events':
        const events = userId 
          ? Analytics.getEventsByUser(userId, limit)
          : Analytics.getEvents(limit)
        
        PerformanceMonitor.trackAPIPerformance(request.url, 'GET', Date.now() - startTime, 200, session.user.id)
        return NextResponse.json({ events })

      case 'performance':
        const metrics = PerformanceMonitor.getMetrics(limit)
        const slowRequests = PerformanceMonitor.getSlowRequests()
        const errorRequests = PerformanceMonitor.getErrorRequests()
        
        PerformanceMonitor.trackAPIPerformance(request.url, 'GET', Date.now() - startTime, 200, session.user.id)
        
        return NextResponse.json({
          metrics,
          slowRequests,
          errorRequests,
          averageResponseTime: PerformanceMonitor.getAverageResponseTime()
        })

      case 'errors':
        const errors = userId 
          ? ErrorLogger.getErrorsByUser(userId)
          : ErrorLogger.getErrors(limit)
        const criticalErrors = ErrorLogger.getCriticalErrors()
        
        PerformanceMonitor.trackAPIPerformance(request.url, 'GET', Date.now() - startTime, 200, session.user.id)
        
        return NextResponse.json({
          errors,
          criticalErrors,
          summary: {
            total: errors.length,
            critical: criticalErrors.length
          }
        })

      case 'health':
        const dbHealth = await HealthChecker.checkDatabase()
        const serviceHealth = await HealthChecker.checkExternalServices()
        const systemHealth = HealthChecker.getSystemHealth()
        
        PerformanceMonitor.trackAPIPerformance(request.url, 'GET', Date.now() - startTime, 200, session.user.id)
        
        return NextResponse.json({
          database: dbHealth,
          services: serviceHealth,
          system: systemHealth,
          timestamp: new Date()
        })

      case 'interviews':
        // Get detailed interview analytics
        const [totalCompletedInterviews, interviews] = await Promise.all([
          prisma.interview.count({ where: { status: 'COMPLETED' } }),
          prisma.interview.findMany({
            where: {
              status: 'COMPLETED',
              score: { not: null }
            },
            select: {
              score: true,
              candidate: {
                select: { position: true }
              }
            }
          })
        ])

        // Calculate average score
        const avgScore = interviews.length > 0 
          ? interviews.reduce((sum: number, interview) => sum + (interview.score || 0), 0) / interviews.length
          : 0

        // Calculate hire rate (assuming score >= 8 is hired)
        const hiredCount = interviews.filter((interview) => (interview.score || 0) >= 8).length
        const hireRate = totalCompletedInterviews > 0 ? (hiredCount / totalCompletedInterviews) * 100 : 0

        // Score distribution
        const scoreRanges = [
          { range: '9.0 - 10.0', min: 9, max: 10 },
          { range: '8.0 - 8.9', min: 8, max: 8.9 },
          { range: '7.0 - 7.9', min: 7, max: 7.9 },
          { range: '6.0 - 6.9', min: 6, max: 6.9 },
          { range: '0.0 - 5.9', min: 0, max: 5.9 }
        ]

        const scoreDistribution = scoreRanges.map(range => ({
          range: range.range,
          count: interviews.filter((interview) => {
            const score = interview.score || 0
            return score >= range.min && score <= range.max
          }).length
        }))

        PerformanceMonitor.trackAPIPerformance(request.url, 'GET', Date.now() - startTime, 200, session.user.id)

        return NextResponse.json({
          avgScore,
          hireRate,
          scoreDistribution,
          totalCompleted: totalCompletedInterviews
        })

      default:
        PerformanceMonitor.trackAPIPerformance(request.url, 'GET', Date.now() - startTime, 400, session.user.id)
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const { searchParams } = new URL(request.url)
    const session = await getServerSession(authOptions)
    
    ErrorLogger.logError(
      errorMessage, 
      { type: searchParams.get('type'), route: request.url },
      session?.user?.id, 
      'medium'
    )
    PerformanceMonitor.trackAPIPerformance(request.url, 'GET', Date.now() - startTime, 500, session?.user?.id)
    
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    const data = await request.json()
    
    const { event, properties = {}, userId } = data
    
    if (!event) {
      PerformanceMonitor.trackAPIPerformance(request.url, 'POST', Date.now() - startTime, 400, session?.user?.id)
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    // Use session user ID if not provided
    const trackingUserId = userId || session?.user?.id

    Analytics.track(event, properties, trackingUserId)
    PerformanceMonitor.trackAPIPerformance(request.url, 'POST', Date.now() - startTime, 200, session?.user?.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Event tracked successfully' 
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const session = await getServerSession(authOptions)
    const data = await request.json().catch(() => ({}))
    
    ErrorLogger.logError(
      errorMessage, 
      { event: data?.event, route: request.url },
      session?.user?.id, 
      'medium'
    )
    PerformanceMonitor.trackAPIPerformance(request.url, 'POST', Date.now() - startTime, 500, session?.user?.id)
    
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}