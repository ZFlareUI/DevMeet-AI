import { NextRequest } from 'next/server'

// Analytics and monitoring types
export interface AnalyticsEvent {
  userId?: string
  sessionId: string
  event: string
  properties: Record<string, any>
  timestamp: Date
  userAgent?: string
  ip?: string
  path?: string
}

export interface PerformanceMetric {
  route: string
  method: string
  duration: number
  statusCode: number
  timestamp: Date
  userId?: string
  error?: string
}

export interface ErrorEvent {
  error: Error | string
  context: Record<string, any>
  userId?: string
  sessionId?: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  stack?: string
}

// In-memory storage for demo (replace with database in production)
const analyticsEvents: AnalyticsEvent[] = []
const performanceMetrics: PerformanceMetric[] = []
const errorEvents: ErrorEvent[] = []

// Analytics class
export class Analytics {
  static track(event: string, properties: Record<string, any> = {}, userId?: string) {
    const analyticsEvent: AnalyticsEvent = {
      userId,
      sessionId: this.generateSessionId(),
      event,
      properties,
      timestamp: new Date(),
    }
    
    analyticsEvents.push(analyticsEvent)
    
    // In production, send to analytics service (Google Analytics, Mixpanel, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsService(analyticsEvent)
    }
  }

  static trackPageView(path: string, userId?: string) {
    this.track('page_view', { path }, userId)
  }

  static trackUserAction(action: string, details: Record<string, any>, userId?: string) {
    this.track('user_action', { action, ...details }, userId)
  }

  static trackInterviewEvent(event: string, interviewId: string, candidateId: string, userId?: string) {
    this.track('interview_event', { 
      event, 
      interviewId, 
      candidateId,
      category: 'interview'
    }, userId)
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static async sendToAnalyticsService(event: AnalyticsEvent) {
    try {
      // Example: Send to Google Analytics or other service
      console.log('Analytics Event:', event)
      
      // In production, you might do:
      // await fetch('https://analytics-service.com/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  static getEvents(limit: number = 100): AnalyticsEvent[] {
    return analyticsEvents.slice(-limit)
  }

  static getEventsByUser(userId: string, limit: number = 50): AnalyticsEvent[] {
    return analyticsEvents
      .filter(event => event.userId === userId)
      .slice(-limit)
  }

  static getEventsByType(eventType: string, limit: number = 50): AnalyticsEvent[] {
    return analyticsEvents
      .filter(event => event.event === eventType)
      .slice(-limit)
  }
}

// Performance monitoring
export class PerformanceMonitor {
  static trackAPIPerformance(
    route: string, 
    method: string, 
    duration: number, 
    statusCode: number,
    userId?: string,
    error?: string
  ) {
    const metric: PerformanceMetric = {
      route,
      method,
      duration,
      statusCode,
      timestamp: new Date(),
      userId,
      error
    }
    
    performanceMetrics.push(metric)
    
    // Alert if performance is poor
    if (duration > 5000) { // 5 seconds
      ErrorLogger.logError(
        `Slow API response: ${route} took ${duration}ms`,
        { route, method, duration, statusCode },
        userId,
        'medium'
      )
    }
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(metric)
    }
  }

  private static async sendToMonitoringService(metric: PerformanceMetric) {
    try {
      // Send to monitoring service (DataDog, New Relic, etc.)
      console.log('Performance Metric:', metric)
    } catch (error) {
      console.error('Failed to send performance metric:', error)
    }
  }

  static getMetrics(limit: number = 100): PerformanceMetric[] {
    return performanceMetrics.slice(-limit)
  }

  static getSlowRequests(threshold: number = 3000): PerformanceMetric[] {
    return performanceMetrics.filter(metric => metric.duration > threshold)
  }

  static getErrorRequests(): PerformanceMetric[] {
    return performanceMetrics.filter(metric => metric.statusCode >= 400)
  }

  static getAverageResponseTime(route?: string): number {
    const relevantMetrics = route 
      ? performanceMetrics.filter(m => m.route === route)
      : performanceMetrics

    if (relevantMetrics.length === 0) return 0

    const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0)
    return total / relevantMetrics.length
  }
}

// Error logging and monitoring
export class ErrorLogger {
  static logError(
    error: Error | string, 
    context: Record<string, any> = {},
    userId?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    sessionId?: string
  ) {
    const errorEvent: ErrorEvent = {
      error,
      context,
      userId,
      sessionId,
      timestamp: new Date(),
      severity,
      stack: error instanceof Error ? error.stack : undefined
    }
    
    errorEvents.push(errorEvent)
    
    // Console log for development
    console.error('Error logged:', errorEvent)
    
    // Send alerts for critical errors
    if (severity === 'critical') {
      this.sendAlert(errorEvent)
    }
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(errorEvent)
    }
  }

  private static async sendAlert(error: ErrorEvent) {
    // In production, send to alerting system (Slack, email, PagerDuty, etc.)
    console.error('CRITICAL ERROR ALERT:', error)
  }

  private static async sendToErrorService(error: ErrorEvent) {
    try {
      // Send to error tracking service (Sentry, Bugsnag, etc.)
      console.log('Error Event:', error)
    } catch (err) {
      console.error('Failed to send error event:', err)
    }
  }

  static getErrors(limit: number = 100): ErrorEvent[] {
    return errorEvents.slice(-limit)
  }

  static getCriticalErrors(): ErrorEvent[] {
    return errorEvents.filter(error => error.severity === 'critical')
  }

  static getErrorsByUser(userId: string): ErrorEvent[] {
    return errorEvents.filter(error => error.userId === userId)
  }
}

// Request tracking middleware helper
export function createRequestTracker() {
  return function trackRequest(request: NextRequest, route: string) {
    const startTime = Date.now()
    
    return {
      end: (statusCode: number, error?: string) => {
        const duration = Date.now() - startTime
        const userId = request.headers.get('x-user-id') || undefined
        
        PerformanceMonitor.trackAPIPerformance(
          route,
          request.method,
          duration,
          statusCode,
          userId,
          error
        )
      }
    }
  }
}

// Health check utilities
export class HealthChecker {
  static async checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy', details?: string }> {
    try {
      // This would typically check database connectivity
      return { status: 'healthy' }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Database check failed' 
      }
    }
  }

  static async checkExternalServices(): Promise<{ status: 'healthy' | 'unhealthy', details?: string }> {
    try {
      // Check external APIs (GitHub, AI services, etc.)
      return { status: 'healthy' }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'External service check failed' 
      }
    }
  }

  static getSystemHealth() {
    const metrics = PerformanceMonitor.getMetrics(50)
    const errors = ErrorLogger.getErrors(20)
    const criticalErrors = ErrorLogger.getCriticalErrors()
    
    return {
      timestamp: new Date(),
      metrics: {
        totalRequests: metrics.length,
        averageResponseTime: PerformanceMonitor.getAverageResponseTime(),
        errorRate: metrics.filter(m => m.statusCode >= 400).length / metrics.length,
        recentErrors: errors.length,
        criticalErrors: criticalErrors.length
      },
      status: criticalErrors.length > 0 ? 'critical' : 
              errors.length > 10 ? 'warning' : 'healthy'
    }
  }
}

// Dashboard data aggregation
export class AnalyticsDashboard {
  static getDashboardData() {
    const events = Analytics.getEvents(500)
    const metrics = PerformanceMonitor.getMetrics(200)
    const errors = ErrorLogger.getErrors(50)
    
    return {
      overview: {
        totalEvents: events.length,
        totalUsers: new Set(events.filter(e => e.userId).map(e => e.userId)).size,
        totalErrors: errors.length,
        averageResponseTime: PerformanceMonitor.getAverageResponseTime()
      },
      topEvents: this.getTopEvents(events),
      slowestRoutes: this.getSlowestRoutes(metrics),
      errorTrends: this.getErrorTrends(errors),
      userActivity: this.getUserActivity(events)
    }
  }

  private static getTopEvents(events: AnalyticsEvent[]) {
    const eventCounts = events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }))
  }

  private static getSlowestRoutes(metrics: PerformanceMetric[]) {
    const routeMetrics = metrics.reduce((acc, metric) => {
      if (!acc[metric.route]) {
        acc[metric.route] = { total: 0, count: 0 }
      }
      acc[metric.route].total += metric.duration
      acc[metric.route].count += 1
      return acc
    }, {} as Record<string, { total: number, count: number }>)

    return Object.entries(routeMetrics)
      .map(([route, data]) => ({
        route,
        averageTime: Math.round(data.total / data.count)
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10)
  }

  private static getErrorTrends(errors: ErrorEvent[]) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentErrors = errors.filter(error => error.timestamp > last24Hours)
    
    return {
      total: recentErrors.length,
      critical: recentErrors.filter(e => e.severity === 'critical').length,
      high: recentErrors.filter(e => e.severity === 'high').length,
      medium: recentErrors.filter(e => e.severity === 'medium').length,
      low: recentErrors.filter(e => e.severity === 'low').length
    }
  }

  private static getUserActivity(events: AnalyticsEvent[]) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentEvents = events.filter(event => event.timestamp > last24Hours)
    
    return {
      activeUsers: new Set(recentEvents.filter(e => e.userId).map(e => e.userId)).size,
      totalSessions: new Set(recentEvents.map(e => e.sessionId)).size,
      pageViews: recentEvents.filter(e => e.event === 'page_view').length,
      userActions: recentEvents.filter(e => e.event === 'user_action').length
    }
  }
}