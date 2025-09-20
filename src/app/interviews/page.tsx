'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PlayCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Interview {
  id: string
  title: string
  type: string
  status: string
  scheduledAt: string
  completedAt?: string
  score?: number
  candidate: {
    id: string
    name: string
    email: string
    position: string
    githubUsername?: string
  }
  interviewer: {
    id: string
    name: string
    email: string
  }
  assessments: Array<{
    id: string
    overallScore: number
    recommendation: string
  }>
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchInterviews()
  }, [])

  useEffect(() => {
    filterInterviews()
  }, [interviews, searchTerm, statusFilter, typeFilter])

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/interviews')
      const data = await response.json()
      setInterviews(data.interviews || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching interviews:', error)
      setIsLoading(false)
    }
  }

  const filterInterviews = () => {
    let filtered = interviews

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(interview => 
        interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(interview => interview.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(interview => interview.type === typeFilter)
    }

    setFilteredInterviews(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TECHNICAL': return DocumentTextIcon
      case 'BEHAVIORAL': return UserIcon
      case 'SYSTEM_DESIGN': return DocumentTextIcon
      case 'CODING_CHALLENGE': return DocumentTextIcon
      default: return DocumentTextIcon
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statuses = ['all', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  const types = ['all', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'CODING_CHALLENGE', 'CULTURAL_FIT']

  const stats = {
    total: interviews.length,
    scheduled: interviews.filter(i => i.status === 'SCHEDULED').length,
    inProgress: interviews.filter(i => i.status === 'IN_PROGRESS').length,
    completed: interviews.filter(i => i.status === 'COMPLETED').length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
                <p className="text-gray-600">Manage and monitor all interview sessions</p>
              </div>
            </div>
            
            <Link href="/interviews/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Interview
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PlayCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search interviews, candidates, positions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Statuses' : status.replace('_', ' ')}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {types.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interviews List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading interviews...</p>
            </CardContent>
          </Card>
        ) : filteredInterviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Interviews Found</h3>
              <p className="text-gray-600 mb-4">
                {interviews.length === 0 
                  ? "Get started by creating your first interview."
                  : "No interviews match your current filters."
                }
              </p>
              {interviews.length === 0 && (
                <Link href="/interviews/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create First Interview
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInterviews.map((interview) => {
              const TypeIcon = getTypeIcon(interview.type)
              return (
                <Card key={interview.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{interview.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                              {interview.status.replace('_', ' ')}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {interview.type.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <UserIcon className="w-4 h-4" />
                              <span>{interview.candidate.name}</span>
                              <span className="text-gray-400">•</span>
                              <span>{interview.candidate.position}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(interview.scheduledAt)}</span>
                            </div>
                            
                            {interview.score && (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-400">Score:</span>
                                <span className={`font-semibold ${getScoreColor(interview.score)}`}>
                                  {interview.score.toFixed(1)}/10
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {interview.candidate.githubUsername && (
                            <div className="mt-1">
                              <span className="text-xs text-blue-600">
                                @{interview.candidate.githubUsername}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {interview.status === 'SCHEDULED' && (
                          <Link href={`/interview/${interview.id}`}>
                            <Button className="bg-green-600 hover:bg-green-700">
                              <PlayCircleIcon className="w-4 h-4 mr-2" />
                              Start Interview
                            </Button>
                          </Link>
                        )}
                        
                        {interview.status === 'IN_PROGRESS' && (
                          <Link href={`/interview/${interview.id}`}>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              <PlayCircleIcon className="w-4 h-4 mr-2" />
                              Continue
                            </Button>
                          </Link>
                        )}
                        
                        {interview.status === 'COMPLETED' && (
                          <Link href={`/candidate/${interview.candidate.id}`}>
                            <Button variant="outline">
                              <DocumentTextIcon className="w-4 h-4 mr-2" />
                              View Results
                            </Button>
                          </Link>
                        )}
                        
                        <Link href={`/candidate/${interview.candidate.id}`}>
                          <Button variant="outline">
                            <UserIcon className="w-4 h-4 mr-2" />
                            View Candidate
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}