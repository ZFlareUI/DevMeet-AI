'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CalendarIcon,
  UserIcon,
  CodeBracketIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Candidate {
  id: string
  name: string
  email: string
  position: string
  githubUsername?: string
}

export default function CreateInterviewPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [interviewData, setInterviewData] = useState({
    title: '',
    description: '',
    type: 'TECHNICAL',
    scheduledAt: '',
    aiPersonality: 'professional',
    techStack: [] as string[],
    difficultyLevel: 'intermediate'
  })
  const [newSkill, setNewSkill] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/candidates')
      const data = await response.json()
      setCandidates(data.candidates || [])
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTechStack = () => {
    if (newSkill.trim() && !interviewData.techStack.includes(newSkill.trim())) {
      setInterviewData(prev => ({
        ...prev,
        techStack: [...prev.techStack, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeTechStack = (skill: string) => {
    setInterviewData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(s => s !== skill)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCandidate) {
      alert('Please select a candidate')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...interviewData,
          candidateId: selectedCandidate,
          interviewerId: 'user_placeholder' // TODO: Replace with actual user ID from session
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/interview/${data.interview.id}`)
      } else {
        throw new Error('Failed to create interview')
      }
    } catch (error) {
      console.error('Error creating interview:', error)
      alert('Failed to create interview. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const interviewTypes = [
    { value: 'TECHNICAL', label: 'Technical Interview', icon: CodeBracketIcon },
    { value: 'BEHAVIORAL', label: 'Behavioral Interview', icon: UserIcon },
    { value: 'SYSTEM_DESIGN', label: 'System Design', icon: AdjustmentsHorizontalIcon },
    { value: 'CODING_CHALLENGE', label: 'Coding Challenge', icon: CodeBracketIcon },
    { value: 'CULTURAL_FIT', label: 'Cultural Fit', icon: UserIcon }
  ]

  const aiPersonalities = [
    { value: 'professional', label: 'Professional', description: 'Formal and structured approach' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and encouraging tone' },
    { value: 'challenging', label: 'Challenging', description: 'Probing and demanding style' },
    { value: 'conversational', label: 'Conversational', description: 'Casual and relaxed approach' }
  ]

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Entry-level questions' },
    { value: 'intermediate', label: 'Intermediate', description: 'Mid-level complexity' },
    { value: 'advanced', label: 'Advanced', description: 'Senior-level challenges' }
  ]

  const commonTechStacks = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'Go',
    'Ruby', 'PHP', 'Angular', 'Vue.js', 'Next.js', 'Express.js', 'Django', 'Flask',
    'Spring', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <PlusIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Interview</h1>
                <p className="text-gray-600">Set up an AI-powered technical interview</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Candidate Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="w-6 h-6" />
                <span>Select Candidate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading candidates...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCandidate === candidate.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedCandidate(candidate.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                          <p className="text-sm text-gray-600">{candidate.position}</p>
                          <p className="text-sm text-gray-500">{candidate.email}</p>
                          {candidate.githubUsername && (
                            <p className="text-sm text-blue-600">@{candidate.githubUsername}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interview Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <InformationCircleIcon className="w-6 h-6" />
                <span>Interview Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Title
                  </label>
                  <input
                    type="text"
                    value={interviewData.title}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Frontend Developer Technical Interview"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Type
                  </label>
                  <select
                    value={interviewData.type}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {interviewTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={interviewData.description}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the interview focus and expectations..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={interviewData.scheduledAt}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AdjustmentsHorizontalIcon className="w-6 h-6" />
                <span>AI Interviewer Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  AI Personality
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiPersonalities.map((personality) => (
                    <div
                      key={personality.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        interviewData.aiPersonality === personality.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setInterviewData(prev => ({ ...prev, aiPersonality: personality.value }))}
                    >
                      <h3 className="font-semibold text-gray-900">{personality.label}</h3>
                      <p className="text-sm text-gray-600">{personality.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {difficultyLevels.map((level) => (
                    <div
                      key={level.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        interviewData.difficultyLevel === level.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setInterviewData(prev => ({ ...prev, difficultyLevel: level.value }))}
                    >
                      <h3 className="font-semibold text-gray-900">{level.label}</h3>
                      <p className="text-sm text-gray-600">{level.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CodeBracketIcon className="w-6 h-6" />
                <span>Technical Focus Areas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add technology or skill..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechStack())}
                />
                <Button type="button" onClick={addTechStack}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {interviewData.techStack.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeTechStack(skill)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Common technologies:</p>
                <div className="flex flex-wrap gap-2">
                  {commonTechStacks
                    .filter(tech => !interviewData.techStack.includes(tech))
                    .slice(0, 12)
                    .map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => setInterviewData(prev => ({ ...prev, techStack: [...prev.techStack, tech] }))}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      + {tech}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedCandidate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Interview...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Create Interview
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}