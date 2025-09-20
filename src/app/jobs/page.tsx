'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, MagnifyingGlassIcon, MapPinIcon, ClockIcon, CurrencyDollarIcon, BriefcaseIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  description: string
  requirements: string[]
  posted: string
  urgent: boolean
}

export default function JobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Senior Full Stack Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$120k - $180k',
      description: 'We are looking for a senior full stack developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies.',
      requirements: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', '5+ years experience'],
      posted: '2 days ago',
      urgent: true
    },
    {
      id: '2',
      title: 'Frontend React Developer',
      company: 'StartupXYZ',
      location: 'Remote',
      type: 'Contract',
      salary: '$80k - $120k',
      description: 'Join our innovative startup as a frontend developer. Work on cutting-edge projects with a talented team.',
      requirements: ['React', 'JavaScript', 'CSS3', 'Git', '3+ years experience'],
      posted: '1 week ago',
      urgent: false
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      company: 'CloudTech Solutions',
      location: 'Austin, TX',
      type: 'Full-time',
      salary: '$100k - $150k',
      description: 'Looking for a DevOps engineer to help us scale our infrastructure and improve our deployment processes.',
      requirements: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', '4+ years experience'],
      posted: '3 days ago',
      urgent: true
    },
    {
      id: '4',
      title: 'Backend Python Developer',
      company: 'DataFlow Inc.',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$90k - $140k',
      description: 'Build robust backend systems for our data processing platform. Work with large-scale distributed systems.',
      requirements: ['Python', 'Django/Flask', 'PostgreSQL', 'Redis', 'API Design'],
      posted: '5 days ago',
      urgent: false
    }
  ])
  const [filteredJobs, setFilteredJobs] = useState(jobs)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
  }, [status, router])

  useEffect(() => {
    const filtered = jobs.filter(job => 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredJobs(filtered)
  }, [searchQuery, jobs])

  const handleApply = (jobId: string) => {
    // TODO: Implement application logic
    router.push(`/jobs/${jobId}/apply`)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-emerald-700 hover:bg-emerald-100"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Available Positions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500" />
                <input 
                  type="text" 
                  placeholder="Search jobs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/70 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-emerald-900 placeholder-emerald-500 backdrop-blur-sm w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Header */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-800">{filteredJobs.length}</div>
                <div className="text-sm text-emerald-600">Available Jobs</div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-800">{filteredJobs.filter(j => j.urgent).length}</div>
                <div className="text-sm text-emerald-600">Urgent Hiring</div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-800">{filteredJobs.filter(j => j.location === 'Remote').length}</div>
                <div className="text-sm text-emerald-600">Remote Jobs</div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-800">{filteredJobs.filter(j => j.type === 'Full-time').length}</div>
                <div className="text-sm text-emerald-600">Full-time</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="bg-white/70 backdrop-blur-sm border-emerald-200 hover:bg-white/80 transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-emerald-800">{job.title}</h3>
                          {job.urgent && (
                            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-lg text-emerald-600 font-medium">{job.company}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-emerald-600">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BriefcaseIcon className="w-4 h-4" />
                        <span>{job.type}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        <span>{job.salary}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{job.posted}</span>
                      </div>
                    </div>

                    <p className="text-emerald-700 mb-4 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req, index) => (
                        <span 
                          key={index} 
                          className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm border border-emerald-200"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-col space-y-3">
                    <Button 
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg transform hover:scale-105 transition-all duration-300 text-white"
                      onClick={() => handleApply(job.id)}
                    >
                      Apply Now
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <BriefcaseIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No jobs found</h3>
            <p className="text-purple-200">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}