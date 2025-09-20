'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/ui/navigation'
import { 
  ArrowRightIcon, 
  ChartBarIcon, 
  CodeBracketIcon, 
  UserGroupIcon,
  PlayCircleIcon,
  SparklesIcon,
  BoltIcon,
  ShieldCheckIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
    setIsVisible(true)
  }, [session, router])

  const handleSignIn = () => {
    router.push('/api/auth/signin')
  }

  const handleGetStarted = () => {
    router.push('/api/auth/signin')
  }

  const handleWatchDemo = () => {
    // Smooth scroll to features section
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleScheduleDemo = () => {
    // For now, show an alert - can be replaced with modal or contact form
    alert('Demo scheduling feature coming soon! For now, please contact us at demo@devmeet.ai')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69]">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                  Revolutionize
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {" "}Technical Hiring
                  </span>
                  <br />
                  with AI Intelligence
                </h1>
                <p className="text-xl text-purple-200 mt-6 leading-relaxed">
                  The first AI-powered interview platform that combines intelligent conversations 
                  with real GitHub code analysis to identify the best technical talent.
                </p>
              </div>
              <div className={`flex flex-col sm:flex-row gap-4 mt-8 transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold transform hover:scale-105 transition-all duration-300" onClick={handleGetStarted}>
                  <RocketLaunchIcon className="w-5 h-5 mr-2" />
                  Start Free Trial
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-purple-400/50 text-white hover:bg-purple-500/20 transition-all duration-300" onClick={handleWatchDemo}>
                  <PlayCircleIcon className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-blue-500/20 rounded-2xl p-8 backdrop-blur-sm border border-purple-500/30 shadow-2xl">
                <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 shadow-2xl border border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600"></div>
                      <div>
                        <div className="font-semibold text-white">AI Interviewer</div>
                        <div className="text-sm text-purple-300">Technical Assessment</div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-purple-900/40 backdrop-blur-sm border border-purple-400/30 rounded-lg p-4">
                      <div className="text-sm text-cyan-300">AI: Can you explain your approach to handling asynchronous operations in JavaScript?</div>
                    </div>
                    <div className="bg-cyan-900/40 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-4">
                      <div className="text-sm text-white">Candidate: I typically use async/await for cleaner code...</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-300 bg-black/20 rounded-lg p-2">
                      <span className="text-green-400">GitHub Analysis: 94% code quality</span>
                      <span className="text-cyan-400">Assessment Score: 8.7/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">89%</div>
              <div className="text-white font-semibold">Hiring Accuracy</div>
              <div className="text-gray-300 text-sm">vs traditional methods</div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">3.2x</div>
              <div className="text-white font-semibold">Faster Hiring</div>
              <div className="text-gray-300 text-sm">time-to-hire reduction</div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">94%</div>
              <div className="text-white font-semibold">Candidate Satisfaction</div>
              <div className="text-gray-300 text-sm">positive feedback score</div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">67%</div>
              <div className="text-white font-semibold">Cost Reduction</div>
              <div className="text-gray-300 text-sm">in hiring expenses</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Future of Technical Interviewing
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Combine AI intelligence with real-world code analysis to make better hiring decisions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-cyan-500/50 hover:from-purple-800/40 hover:to-cyan-800/40 transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-purple-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors">AI-Powered Interviews</h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors">Intelligent interviews that adapt to candidate responses with real-time assessment and dynamic questioning.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-pink-500/50 hover:from-pink-800/40 hover:to-purple-800/40 transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CodeBracketIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-pink-300 transition-colors">GitHub Code Analysis</h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors">Comprehensive analysis of candidate repositories, code quality, and contribution patterns.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-blue-500/50 hover:from-blue-800/40 hover:to-purple-800/40 transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BoltIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">Automated Hiring Pipeline</h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors">End-to-end automation from screening to final hiring decisions with intelligent workflow management.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-indigo-500/50 hover:from-indigo-800/40 hover:to-purple-800/40 transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-300 transition-colors">Advanced Analytics</h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors">Data-driven insights into candidate performance, hiring efficiency, and team building success.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-violet-500/50 hover:from-violet-800/40 hover:to-pink-800/40 transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-400 via-pink-500 to-violet-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-violet-300 transition-colors">Multi-Role Support</h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors">Specialized interview formats for developers, designers, managers, and technical roles.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-900/30 to-cyan-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-teal-500/50 hover:from-teal-800/40 hover:to-cyan-800/40 transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-teal-300 transition-colors">Enterprise Security</h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors">Bank-level security with compliance features, audit trails, and data protection.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-lg">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl text-white/90 mb-8 drop-shadow-sm">
            Join thousands of companies using AI to hire better technical talent
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white/95 backdrop-blur-sm text-purple-700 hover:bg-white font-semibold transform hover:scale-105 transition-all duration-300 shadow-2xl" onClick={handleGetStarted}>
              Start Free Trial
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/80 text-white backdrop-blur-sm hover:bg-white/10 transition-all duration-300 shadow-lg" onClick={handleScheduleDemo}>
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-black/95 to-purple-900/20 backdrop-blur-sm py-12 border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">DevMeet AI</span>
              </div>
              <p className="text-gray-300">
                Revolutionizing technical hiring with AI-powered interviews and GitHub code analysis.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-gray-300">
                <li><button onClick={() => router.push('/features')} className="hover:text-cyan-400 transition-colors">Features</button></li>
                <li><button onClick={() => router.push('/dashboard')} className="hover:text-cyan-400 transition-colors">Dashboard</button></li>
                <li><button onClick={handleWatchDemo} className="hover:text-cyan-400 transition-colors">Demo</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-300">
                <li><button onClick={() => router.push('/candidates')} className="hover:text-cyan-400 transition-colors">Candidates</button></li>
                <li><button onClick={() => router.push('/interviews')} className="hover:text-cyan-400 transition-colors">Interviews</button></li>
                <li><button onClick={() => router.push('/analytics')} className="hover:text-cyan-400 transition-colors">Analytics</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-300">
                <li><button onClick={() => router.push('/jobs')} className="hover:text-cyan-400 transition-colors">Available Jobs</button></li>
                <li><button onClick={() => router.push('/profile')} className="hover:text-cyan-400 transition-colors">Profile</button></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-500/30 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 DevMeet AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}