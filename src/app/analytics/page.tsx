'use client'

interface CandidateSummary {
  id: string
  name: string
  position: string
  status: string
  createdAt: string
}

interface InterviewSummary {
  id: string
  title: string
  candidate: { name: string }
  status: string
  scheduledAt: string
  score?: number
}

interface AnalyticsData {
  totalCandidates: number
  totalInterviews: number
  completedInterviews: number
  avgScore: number
  hireRate: number
  recentCandidates: CandidateSummary[]
  recentInterviews: InterviewSummary[]
  scoreDistribution: { range: string; count: number }[]
  positionStats: { position: string; count: number; avgScore: number }[]
}

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/ui/navigation'
import { 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalCandidates: number
  totalInterviews: number
  completedInterviews: number
  avgScore: number
  hireRate: number
  recentCandidates: CandidateSummary[]
  recentInterviews: InterviewSummary[]
  scoreDistribution: { range: string; count: number }[]
  positionStats: { position: string; count: number; avgScore: number }[]
}

const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  color?: string
}) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-6">
    <div className="flex items-center">
      <div className={`flex-shrink-0 p-3 rounded-lg bg-gradient-to-r ${
        color === 'blue' ? 'from-blue-500 to-blue-600' :
        color === 'green' ? 'from-green-500 to-green-600' :
        color === 'purple' ? 'from-purple-500 to-purple-600' :
        color === 'orange' ? 'from-orange-500 to-orange-600' :
        'from-blue-500 to-blue-600'
      }`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
        {trend && (
          <p className="text-sm text-green-400 mt-1">{trend}</p>
        )}
      </div>
    </div>
  </div>
)

const AnalyticsPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-6">
                    <div className="h-16 bg-white/20 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="p-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Analytics Dashboard</h1>
            <p className="text-white/70">Failed to load analytics data.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation />
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-white/70">
                Hiring pipeline insights and performance metrics
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Candidates"
            value={stats.totalCandidates}
            icon={UserGroupIcon}
            trend="+12% this month"
            color="blue"
          />
          <StatCard
            title="Interviews Conducted"
            value={stats.totalInterviews}
            icon={ClipboardDocumentListIcon}
            trend="+8% this month"
            color="green"
          />
          <StatCard
            title="Average Score"
            value={`${stats.avgScore.toFixed(1)}/10`}
            icon={TrophyIcon}
            trend="+0.3 from last month"
            color="purple"
          />
          <StatCard
            title="Hire Rate"
            value={`${stats.hireRate.toFixed(1)}%`}
            icon={CheckCircleIcon}
            trend="+5% this month"
            color="emerald"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Hiring Funnel */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FunnelIcon className="h-5 w-5 text-white/70 mr-2" />
              <h3 className="text-lg font-medium text-white">Hiring Funnel</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Applied</span>
                <div className="flex items-center">
                  <div className="w-32 bg-white/20 rounded-full h-2 mr-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-white">{stats.totalCandidates}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Interviewed</span>
                <div className="flex items-center">
                  <div className="w-32 bg-white/20 rounded-full h-2 mr-3">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{ 
                      width: `${(stats.totalInterviews / stats.totalCandidates) * 100}%` 
                    }}></div>
                  </div>
                  <span className="text-sm font-medium text-white">{stats.totalInterviews}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Completed</span>
                <div className="flex items-center">
                  <div className="w-32 bg-white/20 rounded-full h-2 mr-3">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ 
                      width: `${(stats.completedInterviews / stats.totalCandidates) * 100}%` 
                    }}></div>
                  </div>
                  <span className="text-sm font-medium text-white">{stats.completedInterviews}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Hired</span>
                <div className="flex items-center">
                  <div className="w-32 bg-white/20 rounded-full h-2 mr-3">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full" style={{ 
                      width: `${stats.hireRate}%` 
                    }}></div>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {Math.round((stats.hireRate / 100) * stats.completedInterviews)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-5 w-5 text-white/70 mr-2" />
              <h3 className="text-lg font-medium text-white">Score Distribution</h3>
            </div>
            <div className="space-y-3">
              {stats.scoreDistribution.map((item) => (
                <div key={item.range} className="flex items-center justify-between">
                  <span className="text-sm text-white/80">{item.range}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-white/20 rounded-full h-2 mr-3">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(item.count / Math.max(...stats.scoreDistribution.map(s => s.count))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-white">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Position Analytics */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg mb-8">
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-lg font-medium text-white">Performance by Position</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Candidates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.positionStats.map((position) => (
                    <tr key={position.position}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {position.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {position.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {position.avgScore.toFixed(1)}/10
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                position.avgScore >= 8 ? 'bg-green-600' :
                                position.avgScore >= 6 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${(position.avgScore / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-medium ${
                            position.avgScore >= 8 ? 'text-green-600' :
                            position.avgScore >= 6 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {position.avgScore >= 8 ? 'Excellent' :
                             position.avgScore >= 6 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Candidates */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Candidates</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentCandidates.map((candidate) => (
                  <div key={candidate.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                      <p className="text-sm text-gray-500">{candidate.position}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        candidate.status === 'HIRED' ? 'bg-green-100 text-green-800' :
                        candidate.status === 'INTERVIEWED' ? 'bg-blue-100 text-blue-800' :
                        candidate.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Interviews */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Interviews</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{interview.title}</p>
                      <p className="text-sm text-gray-500">
                        {interview.candidate?.name} • {new Date(interview.scheduledAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        {interview.status === 'COMPLETED' ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                        ) : interview.status === 'SCHEDULED' ? (
                          <ClockIcon className="h-4 w-4 text-blue-600 mr-1" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span className="text-sm text-gray-500">
                          {interview.score ? `${interview.score.toFixed(1)}/10` : interview.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage