import { Analytics, PerformanceMonitor, ErrorLogger, HealthChecker } from '@/lib/monitoring'

describe('Monitoring System', () => {
  beforeEach(() => {
    // Clear in-memory storage before each test
    jest.clearAllMocks()
  })

  describe('Analytics', () => {
    it('should track events with correct data structure', () => {
      const eventName = 'user_login'
      const properties = { method: 'oauth', provider: 'github' }
      const userId = 'user-123'

      Analytics.track(eventName, properties, userId)

      const events = Analytics.getEvents(1)
      expect(events).toHaveLength(1)
      expect(events[0]).toEqual(
        expect.objectContaining({
          event: eventName,
          properties,
          userId,
          timestamp: expect.any(Date),
          sessionId: expect.any(String),
        })
      )
    })

    it('should track page views correctly', () => {
      Analytics.trackPageView('/dashboard', 'user-123')

      const events = Analytics.getEvents(1)
      expect(events[0].event).toBe('page_view')
      expect(events[0].properties.path).toBe('/dashboard')
    })

    it('should track user actions with details', () => {
      Analytics.trackUserAction('candidate_created', { candidateId: 'cand-123' }, 'user-456')

      const events = Analytics.getEvents(1)
      expect(events[0].event).toBe('user_action')
      expect(events[0].properties.action).toBe('candidate_created')
      expect(events[0].properties.candidateId).toBe('cand-123')
    })

    it('should track interview events', () => {
      Analytics.trackInterviewEvent('started', 'interview-123', 'candidate-456', 'user-789')

      const events = Analytics.getEvents(1)
      expect(events[0].event).toBe('interview_event')
      expect(events[0].properties.event).toBe('started')
      expect(events[0].properties.interviewId).toBe('interview-123')
      expect(events[0].properties.candidateId).toBe('candidate-456')
    })

    it('should filter events by user', () => {
      Analytics.track('event1', {}, 'user1')
      Analytics.track('event2', {}, 'user2')
      Analytics.track('event3', {}, 'user1')

      const user1Events = Analytics.getEventsByUser('user1')
      expect(user1Events).toHaveLength(2)
      expect(user1Events.every(event => event.userId === 'user1')).toBe(true)
    })
  })

  describe('PerformanceMonitor', () => {
    it('should track API performance metrics', () => {
      const route = '/api/candidates'
      const method = 'GET'
      const duration = 250
      const statusCode = 200
      const userId = 'user-123'

      PerformanceMonitor.trackAPIPerformance(route, method, duration, statusCode, userId)

      const metrics = PerformanceMonitor.getMetrics(1)
      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toEqual(
        expect.objectContaining({
          route,
          method,
          duration,
          statusCode,
          userId,
          timestamp: expect.any(Date),
        })
      )
    })

    it('should identify slow requests', () => {
      PerformanceMonitor.trackAPIPerformance('/api/slow', 'GET', 5000, 200)
      PerformanceMonitor.trackAPIPerformance('/api/fast', 'GET', 100, 200)

      const slowRequests = PerformanceMonitor.getSlowRequests(3000)
      expect(slowRequests).toHaveLength(1)
      expect(slowRequests[0].route).toBe('/api/slow')
    })

    it('should identify error requests', () => {
      PerformanceMonitor.trackAPIPerformance('/api/good', 'GET', 200, 200)
      PerformanceMonitor.trackAPIPerformance('/api/bad', 'POST', 300, 500)
      PerformanceMonitor.trackAPIPerformance('/api/notfound', 'GET', 150, 404)

      const errorRequests = PerformanceMonitor.getErrorRequests()
      expect(errorRequests).toHaveLength(2)
      expect(errorRequests.some(req => req.statusCode === 500)).toBe(true)
      expect(errorRequests.some(req => req.statusCode === 404)).toBe(true)
    })

    it('should calculate average response time', () => {
      PerformanceMonitor.trackAPIPerformance('/api/test', 'GET', 100, 200)
      PerformanceMonitor.trackAPIPerformance('/api/test', 'GET', 200, 200)
      PerformanceMonitor.trackAPIPerformance('/api/test', 'GET', 300, 200)

      const avgTime = PerformanceMonitor.getAverageResponseTime('/api/test')
      expect(avgTime).toBe(200) // (100 + 200 + 300) / 3
    })

    it('should calculate overall average response time', () => {
      PerformanceMonitor.trackAPIPerformance('/api/a', 'GET', 100, 200)
      PerformanceMonitor.trackAPIPerformance('/api/b', 'POST', 400, 200)

      const avgTime = PerformanceMonitor.getAverageResponseTime()
      expect(avgTime).toBe(250) // (100 + 400) / 2
    })
  })

  describe('ErrorLogger', () => {
    it('should log errors with correct structure', () => {
      const error = new Error('Test error')
      const context = { route: '/api/test', userId: 'user-123' }
      const severity = 'high'

      ErrorLogger.logError(error, context, 'user-123', severity)

      const errors = ErrorLogger.getErrors(1)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toEqual(
        expect.objectContaining({
          error,
          context,
          userId: 'user-123',
          severity,
          timestamp: expect.any(Date),
          stack: expect.any(String),
        })
      )
    })

    it('should handle string errors', () => {
      const errorMessage = 'String error message'
      
      ErrorLogger.logError(errorMessage, {}, 'user-123', 'medium')

      const errors = ErrorLogger.getErrors(1)
      expect(errors[0].error).toBe(errorMessage)
      expect(errors[0].stack).toBeUndefined()
    })

    it('should filter critical errors', () => {
      ErrorLogger.logError('Low error', {}, 'user1', 'low')
      ErrorLogger.logError('Critical error 1', {}, 'user2', 'critical')
      ErrorLogger.logError('Medium error', {}, 'user3', 'medium')
      ErrorLogger.logError('Critical error 2', {}, 'user4', 'critical')

      const criticalErrors = ErrorLogger.getCriticalErrors()
      expect(criticalErrors).toHaveLength(2)
      expect(criticalErrors.every(error => error.severity === 'critical')).toBe(true)
    })

    it('should filter errors by user', () => {
      ErrorLogger.logError('Error 1', {}, 'user1', 'low')
      ErrorLogger.logError('Error 2', {}, 'user2', 'medium')
      ErrorLogger.logError('Error 3', {}, 'user1', 'high')

      const user1Errors = ErrorLogger.getErrorsByUser('user1')
      expect(user1Errors).toHaveLength(2)
      expect(user1Errors.every(error => error.userId === 'user1')).toBe(true)
    })

    it('should track error counts by severity', () => {
      ErrorLogger.logError('Error 1', {}, 'user1', 'low')
      ErrorLogger.logError('Error 2', {}, 'user2', 'high')
      ErrorLogger.logError('Error 3', {}, 'user3', 'critical')

      const errors = ErrorLogger.getErrors()
      const lowErrors = errors.filter(e => e.severity === 'low')
      const highErrors = errors.filter(e => e.severity === 'high')
      const criticalErrors = errors.filter(e => e.severity === 'critical')

      expect(lowErrors).toHaveLength(1)
      expect(highErrors).toHaveLength(1)
      expect(criticalErrors).toHaveLength(1)
    })
  })

  describe('HealthChecker', () => {
    it('should provide system health metrics', () => {
      const health = HealthChecker.getSystemHealth()

      expect(health).toEqual(
        expect.objectContaining({
          memoryUsage: expect.any(Number),
          cpuUsage: expect.any(Number),
          uptime: expect.any(Number),
        })
      )

      expect(health.memoryUsage).toBeGreaterThanOrEqual(0)
      expect(health.memoryUsage).toBeLessThanOrEqual(100)
      expect(health.uptime).toBeGreaterThan(0)
    })

    it('should check database health', async () => {
      // Mock successful database check
      const health = await HealthChecker.checkDatabase()

      expect(health).toEqual(
        expect.objectContaining({
          status: expect.any(String),
          responseTime: expect.any(Number),
          lastChecked: expect.any(String),
        })
      )
    })

    it('should check external services health', async () => {
      const health = await HealthChecker.checkExternalServices()

      expect(Array.isArray(health)).toBe(true)
      health.forEach(service => {
        expect(service).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            status: expect.any(String),
            responseTime: expect.any(Number),
            lastChecked: expect.any(String),
          })
        )
      })
    })
  })

  describe('AnalyticsDashboard', () => {
    beforeEach(() => {
      // Set up some test data
      Analytics.track('user_login', {}, 'user1')
      Analytics.track('user_login', {}, 'user2')
      Analytics.track('page_view', { path: '/dashboard' }, 'user1')
      Analytics.track('api_request', { route: '/api/candidates' }, 'user1')

      PerformanceMonitor.trackAPIPerformance('/api/test', 'GET', 200, 200)
      PerformanceMonitor.trackAPIPerformance('/api/test', 'POST', 300, 201)
      PerformanceMonitor.trackAPIPerformance('/api/slow', 'GET', 5000, 500)

      ErrorLogger.logError('Test error', {}, 'user1', 'medium')
      ErrorLogger.logError('Critical error', {}, 'user2', 'critical')
    })

    it('should provide comprehensive dashboard data', () => {
      const { AnalyticsDashboard } = require('@/lib/monitoring')
      const dashboard = AnalyticsDashboard.getDashboardData()

      expect(dashboard).toEqual(
        expect.objectContaining({
          totalEvents: expect.any(Number),
          totalUsers: expect.any(Number),
          avgResponseTime: expect.any(Number),
          errorRate: expect.any(Number),
          healthScore: expect.any(Number),
          topEvents: expect.any(Array),
          userEngagement: expect.any(Array),
          performanceByRoute: expect.any(Array),
          recentErrors: expect.any(Array),
        })
      )

      expect(dashboard.totalEvents).toBeGreaterThan(0)
      expect(dashboard.totalUsers).toBeGreaterThan(0)
      expect(dashboard.errorRate).toBeGreaterThanOrEqual(0)
      expect(dashboard.healthScore).toBeGreaterThan(0)
      expect(dashboard.healthScore).toBeLessThanOrEqual(100)
    })

    it('should calculate correct metrics', () => {
      const { AnalyticsDashboard } = require('@/lib/monitoring')
      const dashboard = AnalyticsDashboard.getDashboardData()

      // Should have 4 events total
      expect(dashboard.totalEvents).toBe(4)

      // Should have 2 unique users
      expect(dashboard.totalUsers).toBe(2)

      // Should have performance data
      expect(dashboard.avgResponseTime).toBeGreaterThan(0)

      // Should have error data
      expect(dashboard.recentErrors.length).toBeGreaterThan(0)
    })
  })
})