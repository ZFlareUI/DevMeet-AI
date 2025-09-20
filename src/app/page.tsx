'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ArrowRightIcon, 
  ChartBarIcon, 
  CodeBracketIcon, 
  UserGroupIcon,
  PlayCircleIcon,
  SparklesIcon,
  BoltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      const result = await signIn('github', { 
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      if (result?.error) {
        addToast({ 
          message: 'Failed to sign in. Please try again.', 
          type: 'error' 
        })
      }
    } catch (error) {
      console.error('Sign in error:', error)
      addToast({ 
        message: 'Something went wrong. Please try again.', 
        type: 'error' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetStarted = async () => {
    if (session) {
      router.push('/dashboard')
    } else {
      await handleSignIn()
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DevMeet AI</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
              <a href="#demo" className="text-white/80 hover:text-white transition-colors">Demo</a>
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a>
            </div>
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                className="text-white border-white/20 hover:bg-white/10"
                onClick={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={handleGetStarted}
                disabled={isLoading}
              >
                {session ? 'Go to Dashboard' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                Revolutionize
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  {" "}Technical Hiring
                </span>
                <br />
                with AI Intelligence
              </h1>
              <p className="text-xl text-white/80 mt-6 leading-relaxed">
                The first AI-powered interview platform that combines intelligent conversations 
                with real GitHub code analysis to identify the best technical talent.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  onClick={handleGetStarted}
                  disabled={isLoading}
                >
                  {session ? 'Go to Dashboard' : 'Start Free Trial'}
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    const demoSection = document.getElementById('demo')
                    demoSection?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <PlayCircleIcon className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                <div className="bg-white rounded-lg p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
                      <div>
                        <div className="font-semibold text-gray-900">AI Interviewer</div>
                        <div className="text-sm text-gray-500">Technical Assessment</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">AI: Can you explain your approach to handling asynchronous operations in JavaScript?</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-700">Candidate: I typically use async/await for cleaner code...</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>GitHub Analysis: 94% code quality</span>
                      <span>Assessment Score: 8.7/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">89%</div>
              <div className="text-white/80 font-semibold">Hiring Accuracy</div>
              <div className="text-white/60 text-sm">vs traditional methods</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">3.2x</div>
              <div className="text-white/80 font-semibold">Faster Hiring</div>
              <div className="text-white/60 text-sm">time-to-hire reduction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">94%</div>
              <div className="text-white/80 font-semibold">Candidate Satisfaction</div>
              <div className="text-white/60 text-sm">positive feedback score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">67%</div>
              <div className="text-white/80 font-semibold">Cost Reduction</div>
              <div className="text-white/60 text-sm">in hiring expenses</div>
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
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Combine AI intelligence with real-world code analysis to make better hiring decisions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Interviews</h3>
                <p className="text-white/70">Intelligent interviews that adapt to candidate responses with real-time assessment and dynamic questioning.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <CodeBracketIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">GitHub Code Analysis</h3>
                <p className="text-white/70">Comprehensive analysis of candidate repositories, code quality, and contribution patterns.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <BoltIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Automated Hiring Pipeline</h3>
                <p className="text-white/70">End-to-end automation from screening to final hiring decisions with intelligent workflow management.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Advanced Analytics</h3>
                <p className="text-white/70">Data-driven insights into candidate performance, hiring efficiency, and team building success.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Multi-Role Support</h3>
                <p className="text-white/70">Specialized interview formats for developers, designers, managers, and technical roles.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Enterprise Security</h3>
                <p className="text-white/70">Bank-level security with compliance features, audit trails, and data protection.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of companies using AI to hire better technical talent
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={handleGetStarted}
              disabled={isLoading}
            >
              {session ? 'Go to Dashboard' : 'Start Free Trial'}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
              onClick={() => {
                addToast({ 
                  message: 'Demo scheduling coming soon! Sign up to get early access.', 
                  type: 'info' 
                })
              }}
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">DevMeet AI</span>
              </div>
              <p className="text-gray-400">
                Revolutionizing technical hiring with AI-powered interviews and GitHub code analysis.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DevMeet AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}