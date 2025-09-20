'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <nav className="relative z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <RocketLaunchIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">DevMeet AI</span>
            </div>
            <div className="flex space-x-4">
              <Button variant="ghost" className="text-white" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleGetStarted}>
                Get Started
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8">
            The Future of
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Technical Hiring
            </span>
            <br />
            is Here
          </h1>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-12">
            Revolutionary AI-powered interviews combined with real-time GitHub code analysis.
            <br />
            <span className="text-blue-300">10x faster hiring</span>  
            <span className="text-purple-300"> 90% better matches</span>  
            <span className="text-pink-300"> Zero bias</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-12 py-6 rounded-2xl"
              onClick={handleGetStarted}
            >
              <RocketLaunchIcon className="w-6 h-6 mr-3" />
              Start Free Trial
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-white/60 text-sm">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-white/60 text-sm">Developers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-white/60 text-sm">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24hrs</div>
              <div className="text-white/60 text-sm">Avg Hire Time</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
