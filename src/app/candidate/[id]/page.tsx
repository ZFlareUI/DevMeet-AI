'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  UserIcon,
  CodeBracketIcon,
  ChartBarIcon,
  DocumentTextIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  position: string
  experience: string
  skills: string[]
  status: string
  createdAt: string
  githubUsername?: string
  githubAnalysis?: Array<{
    id: string
    overallScore: number
    activityScore: number
    codeQualityScore: number
    collaborationScore: number
    consistencyScore: number
    insights: string[]
    profileData: any
    repositories: any[]
    languageStats: Record<string, number>
    analyzedAt: string
  }>
  interviews: Array<{
    id: string
    title: string
    type: string
    status: string
    scheduledAt: string
    completedAt?: string
    score?: number
    recommendation?: string
    assessments: Array<{
      id: string
      overallScore: number
      recommendation: string
      feedback: string
      strengths: string[]
      weaknesses: string[]
      technicalScore: number
      communicationScore: number
      problemSolvingScore: number
      cultureScore: number
      createdAt: string
      assessor: {
        name: string
        email: string
      }
    }>
  }>
}

export default function CandidateAssessmentPage() {
  const params = useParams()
  const candidateId = params.id as string
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchCandidate()
  }, [candidateId])

  const fetchCandidate = async () => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`)
      const data = await response.json()
      setCandidate(data.candidate)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching candidate:', error)
      setIsLoading(false)
    }
  }

  const updateCandidateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...candidate, status: newStatus })
      })

      if (response.ok) {
        const data = await response.json()
        setCandidate(data.candidate)
      }
    } catch (error) {
      console.error('Error updating candidate status:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HIRED': return 'bg-green-100 text-green-800'
      case 'OFFERED': return 'bg-blue-100 text-blue-800'
      case 'INTERVIEWING': return 'bg-purple-100 text-purple-800'
      case 'SCREENING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate assessment...</p>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidate Not Found</h2>
          <p className="text-gray-600">The requested candidate could not be found.</p>
        </div>
      </div>
    )
  }

  const latestGitHubAnalysis = candidate.githubAnalysis?.[0]
  const latestInterview = candidate.interviews?.[0]
  const latestAssessment = latestInterview?.assessments?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                <p className="text-gray-600">{candidate.position} • {candidate.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.status)}`}>
                {candidate.status.replace('_', ' ')}
              </span>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => updateCandidateStatus('INTERVIEWING')}
                  variant="outline"
                  disabled={candidate.status === 'INTERVIEWING'}
                >
                  Schedule Interview
                </Button>
                
                {candidate.status === 'INTERVIEWING' && (
                  <>
                    <Button
                      onClick={() => updateCandidateStatus('OFFERED')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Make Offer
                    </Button>
                    <Button
                      onClick={() => updateCandidateStatus('REJECTED')}
                      variant="destructive"
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: UserIcon },
                { id: 'github', name: 'GitHub Analysis', icon: CodeBracketIcon },
                { id: 'interviews', name: 'Interviews', icon: DocumentTextIcon },
                { id: 'assessments', name: 'Assessments', icon: ChartBarIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ChartBarIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Overall Score</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {latestAssessment ? latestAssessment.overallScore.toFixed(1) : 
                           latestGitHubAnalysis ? latestGitHubAnalysis.overallScore.toFixed(1) : 'N/A'}
                          <span className="text-sm text-gray-500">/10</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Interviews</p>
                        <p className="text-2xl font-bold text-gray-900">{candidate.interviews.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CodeBracketIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">GitHub Score</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {latestGitHubAnalysis ? latestGitHubAnalysis.overallScore.toFixed(1) : 'N/A'}
                          <span className="text-sm text-gray-500">/10</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Latest Assessment */}
              {latestAssessment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Technical</p>
                          <p className={`text-2xl font-bold px-2 py-1 rounded ${getScoreColor(latestAssessment.technicalScore)}`}>
                            {latestAssessment.technicalScore.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Communication</p>
                          <p className={`text-2xl font-bold px-2 py-1 rounded ${getScoreColor(latestAssessment.communicationScore)}`}>
                            {latestAssessment.communicationScore.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Problem Solving</p>
                          <p className={`text-2xl font-bold px-2 py-1 rounded ${getScoreColor(latestAssessment.problemSolvingScore)}`}>
                            {latestAssessment.problemSolvingScore.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Culture Fit</p>
                          <p className={`text-2xl font-bold px-2 py-1 rounded ${getScoreColor(latestAssessment.cultureScore)}`}>
                            {latestAssessment.cultureScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold text-gray-900 mb-2">Feedback</h4>
                        <p className="text-gray-700">{latestAssessment.feedback}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                            <CheckCircleIcon className="w-5 h-5 mr-1" />
                            Strengths
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {latestAssessment.strengths.map((strength, index) => (
                              <li key={index} className="text-sm text-gray-700">{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                            <XCircleIcon className="w-5 h-5 mr-1" />
                            Areas for Improvement
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {latestAssessment.weaknesses.map((weakness, index) => (
                              <li key={index} className="text-sm text-gray-700">{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* GitHub Summary */}
              {latestGitHubAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>GitHub Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Activity</p>
                        <p className={`text-xl font-bold px-2 py-1 rounded ${getScoreColor(latestGitHubAnalysis.activityScore)}`}>
                          {latestGitHubAnalysis.activityScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Code Quality</p>
                        <p className={`text-xl font-bold px-2 py-1 rounded ${getScoreColor(latestGitHubAnalysis.codeQualityScore)}`}>
                          {latestGitHubAnalysis.codeQualityScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Collaboration</p>
                        <p className={`text-xl font-bold px-2 py-1 rounded ${getScoreColor(latestGitHubAnalysis.collaborationScore)}`}>
                          {latestGitHubAnalysis.collaborationScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Consistency</p>
                        <p className={`text-xl font-bold px-2 py-1 rounded ${getScoreColor(latestGitHubAnalysis.consistencyScore)}`}>
                          {latestGitHubAnalysis.consistencyScore.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    
                    {latestGitHubAnalysis.insights && latestGitHubAnalysis.insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Key Insights</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {latestGitHubAnalysis.insights.map((insight, index) => (
                            <li key={index} className="text-sm text-gray-700">{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Candidate Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Candidate Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Experience</p>
                      <p className="text-gray-900">{candidate.experience}</p>
                    </div>
                    {candidate.phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-gray-900">{candidate.phone}</p>
                      </div>
                    )}
                    {candidate.githubUsername && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">GitHub</p>
                        <a 
                          href={`https://github.com/${candidate.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          @{candidate.githubUsername}
                        </a>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-600">Applied</p>
                      <p className="text-gray-900">
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(candidate.skills) ? candidate.skills : 
                      JSON.parse(candidate.skills || '[]')).map((skill: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {candidate.interviews.slice(0, 3).map((interview) => (
                      <div key={interview.id} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{interview.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(interview.scheduledAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* GitHub Tab */}
        {activeTab === 'github' && latestGitHubAnalysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries({
                'Overall Score': latestGitHubAnalysis.overallScore,
                'Activity': latestGitHubAnalysis.activityScore,
                'Code Quality': latestGitHubAnalysis.codeQualityScore,
                'Collaboration': latestGitHubAnalysis.collaborationScore
              }).map(([label, score]) => (
                <Card key={label}>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">{label}</p>
                      <p className={`text-3xl font-bold px-3 py-2 rounded-lg ${getScoreColor(score)}`}>
                        {score.toFixed(1)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Language Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Programming Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(latestGitHubAnalysis.languageStats)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([language, bytes]) => (
                    <div key={language} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{language}</p>
                      <p className="text-sm text-gray-600">{(bytes / 1000).toFixed(1)}KB</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Repositories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Repositories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestGitHubAnalysis.repositories.slice(0, 5).map((repo: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{repo.name}</h4>
                          <p className="text-sm text-gray-600">{repo.description || 'No description'}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{repo.language}</span>
                            <span>Stars: {repo.stargazers_count}</span>
                            <span>Forks: {repo.forks_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="space-y-6">
            {candidate.interviews.map((interview) => (
              <Card key={interview.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{interview.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{interview.type} Interview</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interview.status)}`}>
                      {interview.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Scheduled</p>
                        <p className="font-medium">{new Date(interview.scheduledAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {interview.completedAt && (
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Completed</p>
                          <p className="font-medium">{new Date(interview.completedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {interview.score && (
                      <div className="flex items-center space-x-2">
                        <StarIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Score</p>
                          <p className={`font-bold ${getScoreColor(interview.score)}`}>
                            {interview.score.toFixed(1)}/10
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {interview.recommendation && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Recommendation</h4>
                      <p className="text-gray-700">{interview.recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="space-y-6">
            {candidate.interviews.flatMap(interview => 
              interview.assessments.map(assessment => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Assessment for {interview.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          By {assessment.assessor.name} • {new Date(assessment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        assessment.recommendation === 'STRONG_HIRE' ? 'bg-green-100 text-green-800' :
                        assessment.recommendation === 'HIRE' ? 'bg-blue-100 text-blue-800' :
                        assessment.recommendation === 'NO_HIRE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assessment.recommendation.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Technical</p>
                        <p className={`text-2xl font-bold px-2 py-1 rounded ${getScoreColor(assessment.technicalScore)}`}>
                          {assessment.technicalScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Communication</p>
                        <p className={`text-2xl font-bold px-2 py-1 rounded ${getScoreColor(assessment.communicationScore)}`}>
                          {assessment.communicationScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Problem Solving</p>
                        <p className={`text-2xl font-bold px-2 py-1 rounded ${getScoreColor(assessment.problemSolvingScore)}`}>
                          {assessment.problemSolvingScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Culture Fit</p>
                        <p className={`text-2xl font-bold px-2 py-1 rounded ${getScoreColor(assessment.cultureScore)}`}>
                          {assessment.cultureScore.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Overall Feedback</h4>
                        <p className="text-gray-700">{assessment.feedback}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                            <CheckCircleIcon className="w-5 h-5 mr-1" />
                            Strengths
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {assessment.strengths.map((strength, index) => (
                              <li key={index} className="text-sm text-gray-700">{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                            <XCircleIcon className="w-5 h-5 mr-1" />
                            Areas for Improvement
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {assessment.weaknesses.map((weakness, index) => (
                              <li key={index} className="text-sm text-gray-700">{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            
            {candidate.interviews.every(interview => interview.assessments.length === 0) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessments Yet</h3>
                  <p className="text-gray-600">Complete an interview to see assessment results here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}