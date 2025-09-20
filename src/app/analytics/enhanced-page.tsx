'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface AnalyticsData {
  database: {
    totalCandidates: number
    totalInterviews: number
    completedInterviews: number
    completionRate: number
    recentCandidates: Array<{
      id: string
      name: string
      position: string
      status: string
      createdAt: string
    }>
    recentInterviews: Array<{
      id: string
      candidate: { name: string }
      scheduledAt: string
    }>
  }
  monitoring: {
    totalEvents: number
    totalUsers: number
    avgResponseTime: number
    errorRate: number
    healthScore: number
    topEvents: Array<{ event: string; count: number }>
    userEngagement: Array<{ userId: string; eventCount: number }>
    performanceByRoute: Array<{ route: string; avgResponseTime: number; requests: number }>
    recentErrors: Array<{ error: string; severity: string; timestamp: string }>
  }
}

interface PerformanceData {
  metrics: Array<{
    route: string
    method: string
    duration: number
    statusCode: number
    timestamp: string
    userId?: string
  }>
  slowRequests: Array<{
    route: string
    duration: number
    timestamp: string
  }>
  errorRequests: Array<{
    route: string
    statusCode: number
    error?: string
    timestamp: string
  }>
  averageResponseTime: number
}

interface ErrorData {
  errors: Array<{
    error: string
    context: Record<string, any>
    userId?: string
    severity: string
    timestamp: string
  }>
  criticalErrors: Array<{
    error: string
    severity: string
    timestamp: string
  }>
  summary: {
    total: number
    critical: number
  }
}

interface HealthData {
  database: {
    status: string
    responseTime: number
    lastChecked: string
  }
  services: Array<{
    name: string
    status: string
    responseTime: number
    lastChecked: string
  }>
  system: {
    memoryUsage: number
    cpuUsage: number
    uptime: number
  }
  timestamp: string
}

export default function EnhancedAnalyticsPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !['ADMIN', 'INTERVIEWER'].includes(session.user.role)) {
      redirect('/dashboard')
      return
    }

    fetchAnalyticsData()
  }, [session, status, activeTab])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?type=${activeTab}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()

      switch (activeTab) {
        case 'dashboard':
          setAnalytics(data)
          break
        case 'performance':
          setPerformance(data)
          break
        case 'errors':
          setErrors(data)
          break
        case 'health':
          setHealth(data)
          break
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || !['ADMIN', 'INTERVIEWER'].includes(session.user.role)) {
    return null
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor system performance, user engagement, and application health
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Overview', icon: '📊' },
              { id: 'performance', name: 'Performance', icon: '⚡' },
              { id: 'errors', name: 'Errors', icon: '🚨' },
              { id: 'health', name: 'Health', icon: '💚' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && analytics && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                          <span className="text-blue-600 font-bold">👥</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Candidates</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(analytics.database.totalCandidates)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                          <span className="text-green-600 font-bold">📋</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Interviews</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(analytics.database.totalInterviews)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                          <span className="text-purple-600 font-bold">✅</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(analytics.database.completedInterviews)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                          <span className="text-orange-600 font-bold">📈</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.database.completionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monitoring Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                          <span className="text-indigo-600 font-bold">📊</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Events</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(analytics.monitoring.totalEvents)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-teal-100 rounded-md flex items-center justify-center">
                          <span className="text-teal-600 font-bold">⚡</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatDuration(analytics.monitoring.avgResponseTime)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                          <span className="text-red-600 font-bold">🚨</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Error Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.monitoring.errorRate.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                          <span className="text-green-600 font-bold">💚</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Health Score</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.monitoring.healthScore.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Recent Candidates</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {analytics.database.recentCandidates.map((candidate) => (
                          <div key={candidate.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{candidate.name}</p>
                              <p className="text-sm text-gray-500">{candidate.position}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                                {candidate.status}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(candidate.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Recent Interviews</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {analytics.database.recentInterviews.map((interview) => (
                          <div key={interview.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{interview.candidate.name}</p>
                              <p className="text-sm text-gray-500">Interview</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-900">
                                {new Date(interview.scheduledAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(interview.scheduledAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && performance && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Average Response Time</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatDuration(performance.averageResponseTime)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Slow Requests</h3>
                    <p className="text-3xl font-bold text-orange-600">
                      {performance.slowRequests.length}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Error Requests</h3>
                    <p className="text-3xl font-bold text-red-600">
                      {performance.errorRequests.length}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Requests</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Route
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {performance.metrics.slice(0, 20).map((metric, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {metric.route}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {metric.method}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDuration(metric.duration)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                metric.statusCode >= 200 && metric.statusCode < 300
                                  ? 'text-green-600 bg-green-100'
                                  : metric.statusCode >= 400
                                  ? 'text-red-600 bg-red-100'
                                  : 'text-yellow-600 bg-yellow-100'
                              }`}>
                                {metric.statusCode}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(metric.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Errors Tab */}
            {activeTab === 'errors' && errors && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Total Errors</h3>
                    <p className="text-3xl font-bold text-red-600">
                      {errors.summary.total}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Critical Errors</h3>
                    <p className="text-3xl font-bold text-red-800">
                      {errors.summary.critical}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Error Rate</h3>
                    <p className="text-3xl font-bold text-orange-600">
                      {errors.summary.total > 0 ? 
                        ((errors.summary.critical / errors.summary.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Errors</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {errors.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="border-l-4 border-red-400 bg-red-50 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-red-800">{error.error}</p>
                              <p className="text-sm text-red-600 mt-1">
                                {JSON.stringify(error.context)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end ml-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(error.severity)}`}>
                                {error.severity}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(error.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Health Tab */}
            {activeTab === 'health' && health && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Database</h3>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(health.database.status)}`}>
                        {health.database.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDuration(health.database.responseTime)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Usage</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {health.system.memoryUsage.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Uptime</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {Math.floor(health.system.uptime / 3600)}h
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">External Services</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {health.services.map((service, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{service.name}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                              {service.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Response: {formatDuration(service.responseTime)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Last checked: {new Date(service.lastChecked).toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}