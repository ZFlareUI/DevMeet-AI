// API Error handling utilities

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: string[]
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred'
    
    try {
      const errorData: APIResponse = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
      
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage = errorData.errors.join(', ')
      }
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage
    }
    
    throw new APIError(errorMessage, response.status)
  }

  try {
    const data: APIResponse<T> = await response.json()
    
    if (!data.success && data.error) {
      throw new APIError(data.error, response.status)
    }
    
    return data.data || (data as T)
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('Failed to parse response', 500)
  }
}

export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    return await handleAPIResponse<T>(response)
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    // Network or other errors
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0
    )
  }
}

// Specific API methods
export const api = {
  // Candidates
  candidates: {
    getAll: (params?: Record<string, string | number | boolean>) => {
      const searchParams = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
      return apiRequest(`/api/candidates${searchParams ? `?${searchParams}` : ''}`)
    },
    getById: (id: string) => apiRequest(`/api/candidates/${id}`),
    create: (data: unknown) => apiRequest('/api/candidates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: unknown) => apiRequest(`/api/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => apiRequest(`/api/candidates/${id}`, {
      method: 'DELETE'
    })
  },

  // Interviews
  interviews: {
    getAll: (params?: Record<string, string | number | boolean>) => {
      const searchParams = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
      return apiRequest(`/api/interviews${searchParams ? `?${searchParams}` : ''}`)
    },
    getById: (id: string) => apiRequest(`/api/interviews/${id}`),
    create: (data: unknown) => apiRequest('/api/interviews', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: unknown) => apiRequest(`/api/interviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => apiRequest(`/api/interviews/${id}`, {
      method: 'DELETE'
    })
  },

  // Assessments
  assessments: {
    getAll: (params?: Record<string, string | number | boolean>) => {
      const searchParams = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
      return apiRequest(`/api/assessments${searchParams ? `?${searchParams}` : ''}`)
    },
    getById: (id: string) => apiRequest(`/api/assessments/${id}`),
    create: (data: unknown) => apiRequest('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: unknown) => apiRequest(`/api/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => apiRequest(`/api/assessments/${id}`, {
      method: 'DELETE'
    })
  },

  // Analytics
  analytics: {
    getDashboard: () => apiRequest('/api/analytics')
  },

  // GitHub Analysis
  github: {
    analyze: (candidateId: string, username: string) => 
      apiRequest(`/api/candidates/${candidateId}/github-analysis`, {
        method: 'POST',
        body: JSON.stringify({ username })
      })
  }
}

// Error handling hook for React components
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  type: ToastType
  title?: string
  message: string
  duration?: number
}

// HTTP status code helpers
export const isClientError = (status: number) => status >= 400 && status < 500
export const isServerError = (status: number) => status >= 500
export const isUnauthorized = (status: number) => status === 401
export const isForbidden = (status: number) => status === 403
export const isNotFound = (status: number) => status === 404
export const isConflict = (status: number) => status === 409