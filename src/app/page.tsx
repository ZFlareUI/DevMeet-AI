'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
      {/* Navigation */}
      <nav className="relative z-50 bg-black/30 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className={`flex items-center space-x-2 transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DevMeet AI</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-purple-200 hover:text-cyan-400 transition-colors cursor-pointer">Features</a>
              <a href="#demo" className="text-purple-200 hover:text-cyan-400 transition-colors cursor-pointer">Demo</a>
              <a href="#pricing" className="text-purple-200 hover:text-cyan-400 transition-colors cursor-pointer">Pricing</a>
            </div>
            <div className={`flex space-x-4 transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <Button variant="ghost" className="text-white border-purple-400/50 hover:bg-purple-500/20" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold" onClick={handleGetStarted}>
                Get Started
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
              <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#F4D03F]/20 rounded-2xl p-8 backdrop-blur-sm border border-[#D4AF37]/10">
                <div className="bg-[#FFFFFF] rounded-lg p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]"></div>
                      <div>
                        <div className="font-semibold text-[#0A1628]">AI Interviewer</div>
                        <div className="text-sm text-[#1E293B]">Technical Assessment</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
                      <div className="text-sm text-cyan-300">AI: Can you explain your approach to handling asynchronous operations in JavaScript?</div>
                    </div>
                    <div className="bg-purple-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
                      <div className="text-sm text-white">Candidate: I typically use async/await for cleaner code...</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-300">
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
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Interviews</h3>
                <p className="text-gray-300">Intelligent interviews that adapt to candidate responses with real-time assessment and dynamic questioning.</p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <CodeBracketIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">GitHub Code Analysis</h3>
                <p className="text-gray-300">Comprehensive analysis of candidate repositories, code quality, and contribution patterns.</p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <BoltIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Automated Hiring Pipeline</h3>
                <p className="text-gray-300">End-to-end automation from screening to final hiring decisions with intelligent workflow management.</p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Advanced Analytics</h3>
                <p className="text-gray-300">Data-driven insights into candidate performance, hiring efficiency, and team building success.</p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Multi-Role Support</h3>
                <p className="text-gray-300">Specialized interview formats for developers, designers, managers, and technical roles.</p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Enterprise Security</h3>
                <p className="text-gray-300">Bank-level security with compliance features, audit trails, and data protection.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl text-gray-100 mb-8">
            Join thousands of companies using AI to hire better technical talent
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-semibold transform hover:scale-105 transition-all duration-300" onClick={handleGetStarted}>
              Start Free Trial
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 transition-all duration-300" onClick={handleScheduleDemo}>
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/90 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
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
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a></li>
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