'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon, RocketLaunchIcon, SparklesIcon, BoltIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

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
    router.push('/auth/signin')
  }

  const handleGetStarted = () => {
    router.push('/auth/register')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>

      <nav className="relative z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className={`flex items-center space-x-3 transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                <RocketLaunchIcon className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">DevMeet AI</span>
            </div>
            <div className={`flex space-x-4 transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <Button variant="ghost" className="text-white hover:bg-white/10 transition-all duration-300" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-300" onClick={handleGetStarted}>
                Get Started
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20 md:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                <SparklesIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">Revolutionary AI Technology</span>
                <BoltIcon className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8">
              The Future of
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                Technical Hiring
              </span>
              <br />
              is Here
            </h1>
          </div>
          
          <div className={`transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <p className="text-xl text-white/90 max-w-4xl mx-auto mb-12 leading-relaxed">
              Revolutionary AI-powered interviews combined with real-time GitHub code analysis.
              <br />
              <span className="text-blue-300 font-semibold">⚡ 10x faster hiring</span> • 
              <span className="text-purple-300 font-semibold"> 🎯 90% better matches</span> • 
              <span className="text-pink-300 font-semibold"> 🚀 Zero bias</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-12 py-6 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                onClick={handleGetStarted}
              >
                <RocketLaunchIcon className="w-6 h-6 mr-3" />
                Start Free Trial
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-2xl backdrop-blur-sm transition-all duration-300"
              >
                Watch Demo
              </Button>
            </div>
          </div>

          <div className={`transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              <div className="text-center group">
                <div className="text-4xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">500+</div>
                <div className="text-white/70 text-sm">Companies</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors duration-300">50K+</div>
                <div className="text-white/70 text-sm">Developers</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">95%</div>
                <div className="text-white/70 text-sm">Success Rate</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors duration-300">24hrs</div>
                <div className="text-white/70 text-sm">Avg Hire Time</div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">AI-Powered Interviews</h3>
                <p className="text-white/70">Advanced AI conducts technical interviews with adaptive questioning and real-time assessment.</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <BoltIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">GitHub Analysis</h3>
                <p className="text-white/70">Deep code analysis of candidates' GitHub repositories for comprehensive skill assessment.</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Instant Results</h3>
                <p className="text-white/70">Get comprehensive candidate reports with actionable insights in minutes, not days.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
