'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/ui/navigation'
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
      <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69]">
      <Navigation showBackButton={true} backUrl="/" backLabel="Home" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Available Positions</h1>
          <p className="text-lg text-purple-200">
            Discover exciting career opportunities in technology
          </p>
        </div>
        
        {/* Search */}
        <div className="mb-8 flex justify-center">
          <div className="relative max-w-md w-full">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" />
            <input 
              type="text" 
              placeholder="Search jobs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 bg-gradient-to-r from-black/40 to-purple-900/40 border border-purple-500/40 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 text-white placeholder-purple-300 backdrop-blur-md w-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Stats Header */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-black/30 via-cyan-900/20 to-black/30 backdrop-blur-md border border-cyan-500/40 shadow-xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{filteredJobs.length}</div>
                <div className="text-sm text-cyan-200">Available Jobs</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-black/30 via-purple-900/20 to-black/30 backdrop-blur-md border border-purple-500/40 shadow-xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{filteredJobs.filter(j => j.urgent).length}</div>
                <div className="text-sm text-purple-200">Urgent Hiring</div>
              </CardContent>
            </Card>
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{filteredJobs.filter(j => j.location === 'Remote').length}</div>
                <div className="text-sm text-purple-300">Remote Jobs</div>
              </CardContent>
            </Card>
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{filteredJobs.filter(j => j.type === 'Full-time').length}</div>
                <div className="text-sm text-purple-300">Full-time</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/40 transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-white">{job.title}</h3>
                          {job.urgent && (
                            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-lg text-cyan-400 font-medium">{job.company}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-purple-300">
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

                    <p className="text-gray-300 mb-4 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req, index) => (
                        <span 
                          key={index} 
                          className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-col space-y-3">
                    <Button 
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 shadow-lg transform hover:scale-105 transition-all duration-300 text-white"
                      onClick={() => handleApply(job.id)}
                    >
                      Apply Now
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
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