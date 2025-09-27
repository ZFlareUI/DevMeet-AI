import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    hasNext?: boolean
    hasPrev?: boolean
  }
}

export const createSuccessResponse = <T = unknown>(
  data: T,
  meta?: ApiResponse['meta'],
  status = 200
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  )
}

export const createErrorResponse = (
  message: string,
  status = 400,
  code = 'BAD_REQUEST',
  details?: unknown
): NextResponse<ApiResponse> => {
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
  }

  if (details && typeof details === 'object' && details !== null) {
    errorResponse.error!.details = details
  }

  return NextResponse.json(errorResponse, { status })
}

export const createValidationErrorResponse = (errors: Record<string, string[]>) => {
  return createErrorResponse(
    'Validation failed',
    422,
    'VALIDATION_ERROR',
    errors
  )
}

export const createNotFoundResponse = (resource = 'Resource') => {
  return createErrorResponse(`${resource} not found`, 404, 'NOT_FOUND')
}

export const createUnauthorizedResponse = (message = 'Unauthorized') => {
  return createErrorResponse(message, 401, 'UNAUTHORIZED')
}

export const createForbiddenResponse = (message = 'Forbidden') => {
  return createErrorResponse(message, 403, 'FORBIDDEN')
}

export const createServerErrorResponse = (error: Error) => {
  console.error('Server Error:', error)
  return createErrorResponse(
    'An unexpected error occurred',
    500,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? error.message : undefined
  )
}

// Helper to create paginated responses
export const createPaginatedResponse = <T = unknown>({
  data,
  page,
  limit,
  total,
}: {
  data: T
  page: number
  limit: number
  total: number
}) => {
  const totalPages = Math.ceil(total / limit)
  
  return createSuccessResponse<T>(data, {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  })
}
