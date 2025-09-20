'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Logger } from '@/lib/error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props
    const { errorId } = this.state

    // Log error details
    Logger.error('React Error Boundary caught an error', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    })

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { errorInfo } })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorId: ''
    })
  }

  render() {
    const { hasError, error, errorId } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <ErrorFallback
          error={error}
          errorId={errorId}
          onRetry={this.handleRetry}
        />
      )
    }

    return children
  }
}

interface ErrorFallbackProps {
  error?: Error
  errorId: string
  onRetry: () => void
}

function ErrorFallback({ error, errorId, onRetry }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Something went wrong
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              We apologize for the inconvenience. The error has been logged and our team has been notified.
            </p>

            {isDevelopment && error && (
              <div className="mt-4 p-4 bg-red-50 rounded-md text-left">
                <h3 className="text-sm font-medium text-red-800">
                  Error Details (Development Only)
                </h3>
                <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              Error ID: {errorId}
            </div>

            <div className="mt-6 flex flex-col space-y-3">
              <button
                onClick={onRetry}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for error reporting
export function useErrorHandler() {
  return (error: Error, context?: string) => {
    Logger.error(`Error in ${context || 'Unknown context'}`, error)
    
    // Report to error tracking service
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } })
    }
  }
}