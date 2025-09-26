'use client'

import React, { useState, useEffect } from 'react'
import { signIn, getProviders, useSession } from 'next-auth/react'
import type { ClientSafeProvider } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Toast hook (simplified)
const useToast = () => ({
  addToast: ({ message, type }: { message: string; type: 'success' | 'error' }) => {
    // In a real app, this would trigger a toast notification
    console.log(`${type.toUpperCase()}: ${message}`)
    if (type === 'error') {
      alert(`Error: ${message}`)
    }
  }
})

export default function SignInPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Demo accounts for quick access
  const demoAccounts = [
    { email: 'admin@devmeet.ai', password: 'admin123', role: 'Administrator', color: 'bg-red-500' },
    { email: 'recruiter@devmeet.ai', password: 'recruiter123', role: 'Recruiter', color: 'bg-blue-500' },
    { email: 'interviewer@devmeet.ai', password: 'interviewer123', role: 'Interviewer', color: 'bg-green-500' },
    { email: 'candidate@devmeet.ai', password: 'candidate123', role: 'Candidate', color: 'bg-purple-500' }
  ]

  useEffect(() => {
    // Redirect if already signed in
    if (session) {
      router.push('/dashboard')
      return
    }

    // Load authentication providers
    getProviders().then(setProviders)

    // Show success message if coming from registration
    const message = searchParams?.get('message')
    if (message) {
      addToast({ message, type: 'success' })
    }
  }, [session, router, searchParams, addToast])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        addToast({ message: result.error, type: 'error' })
        setErrors({ submit: result.error })
      } else if (result?.ok) {
        addToast({ message: 'Signed in successfully!', type: 'success' })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      addToast({ message: 'Something went wrong. Please try again.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoSignIn = async (email: string, password: string, role: string) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        addToast({ message: result.error, type: 'error' })
      } else if (result?.ok) {
        addToast({ message: `Signed in as ${role}!`, type: 'success' })
        router.push('/dashboard')
      }
    } catch (error) {
      addToast({ message: 'Failed to sign in', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubSignIn = () => {
    setIsLoading(true)
    signIn('github', { callbackUrl: '/dashboard' })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
            <p className="text-blue-200 mb-6">You&apos;re already signed in as {session.user?.name}</p>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="flex min-h-screen">
        {/* Left Side - Sign In Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">DA</span>
              </div>
              <h2 className="mt-6 text-3xl font-bold text-white">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-blue-200">
                Sign in to continue to DevMeet AI
              </p>
            </div>

            {/* Sign In Form */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-300" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-500' : 'border-white/30'
                        }`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-300" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.password ? 'border-red-500' : 'border-white/30'
                        }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-300 hover:text-white"
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="rememberMe" className="ml-2 text-sm text-white">
                        Remember me
                      </label>
                    </div>
                    <Link href="/auth/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="flex items-center space-x-2 text-red-400 text-sm">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span>{errors.submit}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

                {/* GitHub OAuth */}
                {providers?.github && (
                  <>
                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/20" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-transparent text-blue-200">Or continue with</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleGitHubSignIn}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white border-gray-600"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                      Continue with GitHub
                    </Button>
                  </>
                )}

                {/* Sign Up Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-blue-200">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium underline">
                      Sign up here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side - Demo Accounts */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:px-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Try Demo Accounts</h3>
              <p className="text-blue-200">Click any account below for instant access</p>
            </div>

            <div className="space-y-4">
              {demoAccounts.map((account) => (
                <Card key={account.email} className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <CardContent 
                    className="p-4"
                    onClick={() => handleDemoSignIn(account.email, account.password, account.role)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full ${account.color} flex items-center justify-center`}>
                        <span className="text-white font-bold text-lg">
                          {account.role.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{account.role}</h4>
                        <p className="text-blue-200 text-sm">{account.email}</p>
                      </div>
                      <div className="text-blue-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-blue-300">
                Demo accounts provide full access to all features
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}