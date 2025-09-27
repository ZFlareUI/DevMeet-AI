'use client';

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

export default function AuthPage() {
  const { data: session } = useSession()
  const { addToast } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const demoAccounts = [
    { email: 'admin@devmeet.ai', password: 'admin123', role: 'Administrator' },
    { email: 'recruiter@devmeet.ai', password: 'recruiter123', role: 'Recruiter' },
    { email: 'interviewer@devmeet.ai', password: 'interviewer123', role: 'Interviewer' },
    { email: 'candidate@devmeet.ai', password: 'candidate123', role: 'Candidate' }
  ]

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningIn(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        addToast({ message: result.error, type: 'error' })
      } else if (result?.ok) {
        addToast({ message: 'Signed in successfully!', type: 'success' })
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Sign in error:', error)
      addToast({ message: 'Failed to sign in', type: 'error' })
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleDemoSignIn = async (email: string, password: string) => {
    setIsSigningIn(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        addToast({ message: result.error, type: 'error' })
      } else if (result?.ok) {
        addToast({ message: 'Signed in successfully!', type: 'success' })
        window.location.href = '/dashboard'
      }
    } catch (_error) {
      addToast({ message: 'Failed to sign in', type: 'error' })
    } finally {
      setIsSigningIn(false)
    }
  }

  const isGitHubConfigured = () => {
    // Check if GitHub OAuth is properly configured
    // In development, we'll check if we have real credentials
    if (typeof window !== 'undefined') {
      return true; // For now, always show GitHub option since we have credentials
    }
    return false;
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome back!</h2>
            <p className="text-gray-600 mb-4">
              You&apos;re signed in as {session.user?.name}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => signOut()} 
                variant="outline"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">DevMeet AI</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Demo Accounts */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Demo Accounts</h3>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoSignIn(account.email, account.password)}
                  disabled={isSigningIn}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium">{account.role}</div>
                  <div className="text-sm text-gray-600">{account.email}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Manual Sign In */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sign In</h3>
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSigningIn ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* GitHub OAuth (if configured) */}
        {isGitHubConfigured() && (
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={() => signIn('github')}
                disabled={isSigningIn}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                Sign in with GitHub
              </Button>
            </CardContent>
          </Card>
        )}

        {/* GitHub Setup Instructions */}
        {!isGitHubConfigured() && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                GitHub OAuth Setup Required
              </h3>
              <p className="text-yellow-700 text-sm mb-3">
                To enable GitHub sign-in, create a GitHub OAuth App:
              </p>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Go to GitHub Settings → Developer settings → OAuth Apps</li>
                <li>Create a new OAuth App</li>
                <li>Set Authorization callback URL to: <code className="bg-yellow-100 px-1 rounded">http://localhost:3000/api/auth/callback/github</code></li>
                <li>Update your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file with your Client ID and Secret</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}