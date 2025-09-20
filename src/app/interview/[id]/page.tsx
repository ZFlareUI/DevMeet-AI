'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import io, { Socket } from 'socket.io-client'
import { 
  PlayCircleIcon, 
  StopCircleIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Question {
  id: string
  question: string
  type: 'technical' | 'behavioral' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  expectedAnswer?: string
}

interface Response {
  questionId: string
  response: string
  timestamp: Date
  score?: number
  feedback?: string
}

interface InterviewData {
  id: string
  title: string
  candidate: {
    id: string
    name: string
    email: string
    position: string
    githubUsername?: string
    githubAnalysis?: Array<{
      overallScore: number
      activityScore: number
      codeQualityScore: number
    }>
  }
  status: string
  questions: {
    questions: Question[]
    responses: Response[]
    currentIndex: number
  }
  aiPersonality: string
  techStack: string[]
}

export default function LiveInterviewPage() {
  const params = useParams()
  const interviewId = params.id as string
  const [socket, setSocket] = useState<Socket | null>(null)
  const [interview, setInterview] = useState<InterviewData | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [candidateResponse, setCandidateResponse] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchInterview()
    initializeSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [interviewId])

  const fetchInterview = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`)
      const data = await response.json()
      setInterview(data.interview)
      setCurrentQuestionIndex(data.interview.questions.currentIndex || 0)
      setInterviewStarted(data.interview.status === 'IN_PROGRESS')
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching interview:', error)
      setIsLoading(false)
    }
  }

  const initializeSocket = () => {
    const newSocket = io({ path: '/api/socket/io' })
    
    newSocket.on('connect', () => {
      console.log('Connected to server')
      newSocket.emit('join-interview', interviewId)
    })

    newSocket.on('question-asked', (data) => {
      console.log('New question received:', data)
    })

    newSocket.on('evaluation-completed', (data) => {
      console.log('Evaluation completed:', data)
      setEvaluating(false)
    })

    setSocket(newSocket)
  }

  const startInterview = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })

      if (response.ok) {
        setInterviewStarted(true)
        startTimer()
        if (socket) {
          socket.emit('interview-started', { interviewId })
        }
      }
    } catch (error) {
      console.error('Error starting interview:', error)
    }
  }

  const endInterview = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' })
      })

      if (response.ok) {
        setInterviewStarted(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        if (socket) {
          socket.emit('interview-ended', { interviewId })
        }
      }
    } catch (error) {
      console.error('Error ending interview:', error)
    }
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)
  }

  const submitResponse = async () => {
    if (!candidateResponse.trim() || !interview) return

    setEvaluating(true)
    
    try {
      const response = await fetch(`/api/interviews/${interviewId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: candidateResponse,
          questionIndex: currentQuestionIndex
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Update interview data
        await fetchInterview()
        
        // Move to next question
        if (data.nextQuestionIndex < interview.questions.questions.length) {
          setCurrentQuestionIndex(data.nextQuestionIndex)
        }
        
        setCandidateResponse('')
        
        if (socket) {
          socket.emit('response-given', {
            interviewId,
            questionIndex: currentQuestionIndex,
            response: candidateResponse,
            evaluation: data.evaluation
          })
        }
      }
    } catch (error) {
      console.error('Error submitting response:', error)
    } finally {
      setEvaluating(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Not Found</h2>
          <p className="text-gray-600">The requested interview could not be found.</p>
        </div>
      </div>
    )
  }

  const currentQuestion = interview.questions.questions[currentQuestionIndex]
  const hasMoreQuestions = currentQuestionIndex < interview.questions.questions.length - 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{interview.title}</h1>
                <p className="text-sm text-gray-600">Live Interview Session</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <ClockIcon className="w-5 h-5" />
                <span className="font-mono">{formatTime(timeElapsed)}</span>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                interview.status === 'IN_PROGRESS' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {interview.status.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Interview Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video/Audio Section */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AI Interviewer */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <ComputerDesktopIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">AI Interviewer</h3>
                        <p className="text-sm text-gray-600">Technical Assessment</p>
                      </div>
                    </div>
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-white font-bold text-xl">AI</span>
                        </div>
                        <p className="text-gray-600">AI Interviewer Active</p>
                      </div>
                    </div>
                  </div>

                  {/* Candidate */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{interview.candidate.name}</h3>
                        <p className="text-sm text-gray-600">{interview.candidate.position}</p>
                      </div>
                    </div>
                    <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <VideoCameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Camera placeholder</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center space-x-4 mt-6">
                  {!interviewStarted ? (
                    <Button 
                      onClick={startInterview}
                      className="bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <PlayCircleIcon className="w-5 h-5 mr-2" />
                      Start Interview
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className={isRecording ? 'bg-red-100 border-red-300' : ''}
                        onClick={() => setIsRecording(!isRecording)}
                      >
                        <MicrophoneIcon className="w-5 h-5 mr-2" />
                        {isRecording ? 'Recording...' : 'Record'}
                      </Button>
                      
                      <Button
                        onClick={endInterview}
                        variant="destructive"
                        size="lg"
                      >
                        <StopCircleIcon className="w-5 h-5 mr-2" />
                        End Interview
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Question Section */}
            {interviewStarted && currentQuestion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Question {currentQuestionIndex + 1} of {interview.questions.questions.length}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white font-bold text-sm">AI</span>
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{currentQuestion.question}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {currentQuestion.type} question
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Your Response:
                      </label>
                      <textarea
                        value={candidateResponse}
                        onChange={(e) => setCandidateResponse(e.target.value)}
                        placeholder="Type your response here..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={evaluating}
                      />
                      
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          {candidateResponse.length} characters
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            onClick={submitResponse}
                            disabled={!candidateResponse.trim() || evaluating}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {evaluating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Evaluating...
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                Submit Response
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Responses */}
            {interview.questions.responses && interview.questions.responses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Previous Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interview.questions.responses.map((response, index) => (
                      <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-gray-900">
                            Q{index + 1}: {interview.questions.questions[index]?.question}
                          </p>
                          {response.score && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              response.score >= 8 ? 'bg-green-100 text-green-800' :
                              response.score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {response.score}/10
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">{response.response}</p>
                        {response.feedback && (
                          <p className="text-sm text-gray-600 italic">{response.feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Candidate Info */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Name</p>
                    <p className="text-gray-900">{interview.candidate.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Position</p>
                    <p className="text-gray-900">{interview.candidate.position}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-gray-900">{interview.candidate.email}</p>
                  </div>
                  {interview.candidate.githubUsername && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">GitHub</p>
                      <a 
                        href={`https://github.com/${interview.candidate.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        @{interview.candidate.githubUsername}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* GitHub Analysis */}
            {interview.candidate.githubAnalysis && interview.candidate.githubAnalysis[0] && (
              <Card>
                <CardHeader>
                  <CardTitle>GitHub Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Overall Score</span>
                      <span className="font-semibold text-gray-900">
                        {interview.candidate.githubAnalysis[0].overallScore.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Activity</span>
                      <span className="font-semibold text-gray-900">
                        {interview.candidate.githubAnalysis[0].activityScore.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Code Quality</span>
                      <span className="font-semibold text-gray-900">
                        {interview.candidate.githubAnalysis[0].codeQualityScore.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interview Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Questions</span>
                    <span className="font-medium">
                      {currentQuestionIndex + 1} / {interview.questions.questions.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((currentQuestionIndex + 1) / interview.questions.questions.length) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time Elapsed</span>
                    <span className="font-medium font-mono">{formatTime(timeElapsed)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tech Stack */}
            <Card>
              <CardHeader>
                <CardTitle>Tech Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {interview.techStack.map((tech, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}