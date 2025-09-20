import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

// Error types for better categorization
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

export interface ApiError {
  type: ErrorType
  message: string
  details?: any
  statusCode: number
  timestamp: string
  requestId?: string
}

export class AppError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly details?: any
  public readonly isOperational: boolean

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number,
    details?: any,
    isOperational = true
  ) {
    super(message)
    this.type = type
    this.statusCode = statusCode
    this.details = details
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// Logger utility
export class Logger {
  private static formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString()
    const metaStr = meta ? JSON.stringify(meta, null, 2) : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`
  }

  static info(message: string, meta?: any): void {
    console.log(this.formatMessage('info', message, meta))
  }

  static warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message, meta))
  }

  static error(message: string, error?: any, meta?: any): void {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...meta
    } : { error, ...meta }

    console.error(this.formatMessage('error', message, errorDetails))
  }

  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, meta))
    }
  }
}

// Error handler for API routes
export function handleApiError(error: unknown, requestId?: string): NextResponse {
  Logger.error('API Error occurred', error, { requestId })

  let apiError: ApiError

  if (error instanceof AppError) {
    apiError = {
      type: error.type,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      requestId
    }
  } else if (error instanceof ZodError) {
    apiError = {
      type: ErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      details: error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })),
      statusCode: 400,
      timestamp: new Date().toISOString(),
      requestId
    }
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database operation failed'
    let statusCode = 500

    switch (error.code) {
      case 'P2002':
        message = 'A record with this information already exists'
        statusCode = 409
        break
      case 'P2025':
        message = 'Record not found'
        statusCode = 404
        break
      case 'P2003':
        message = 'Foreign key constraint failed'
        statusCode = 400
        break
    }

    apiError = {
      type: ErrorType.DATABASE_ERROR,
      message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        meta: error.meta
      } : undefined,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId
    }
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    apiError = {
      type: ErrorType.DATABASE_ERROR,
      message: 'Unknown database error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      requestId
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    apiError = {
      type: ErrorType.VALIDATION_ERROR,
      message: 'Database validation error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode: 400,
      timestamp: new Date().toISOString(),
      requestId
    }
  } else {
    // Unknown error
    apiError = {
      type: ErrorType.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? 
        error instanceof Error ? error.message : String(error) : undefined,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      requestId
    }
  }

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    delete apiError.details
  }

  return NextResponse.json(
    {
      success: false,
      error: apiError
    },
    { status: apiError.statusCode }
  )
}

// Async error wrapper for API routes
export function asyncHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
      return handleApiError(error, requestId)
    }
  }
}

// Common API errors
export const ApiErrors = {
  notFound: (resource: string) => new AppError(
    ErrorType.NOT_FOUND_ERROR,
    `${resource} not found`,
    404
  ),

  unauthorized: (message = 'Authentication required') => new AppError(
    ErrorType.AUTHENTICATION_ERROR,
    message,
    401
  ),

  forbidden: (message = 'Insufficient permissions') => new AppError(
    ErrorType.AUTHORIZATION_ERROR,
    message,
    403
  ),

  validation: (message: string, details?: any) => new AppError(
    ErrorType.VALIDATION_ERROR,
    message,
    400,
    details
  ),

  rateLimit: (message = 'Rate limit exceeded') => new AppError(
    ErrorType.RATE_LIMIT_ERROR,
    message,
    429
  ),

  internal: (message = 'Internal server error') => new AppError(
    ErrorType.INTERNAL_SERVER_ERROR,
    message,
    500
  ),

  externalApi: (service: string, message?: string) => new AppError(
    ErrorType.EXTERNAL_API_ERROR,
    message || `${service} service is currently unavailable`,
    503
  )
}

// Success response helper
export function successResponse(data: any, message?: string, statusCode = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  )
}

// Pagination response helper
export function paginatedResponse(
  data: any[],
  total: number,
  page: number,
  limit: number,
  message?: string
): NextResponse {
  const totalPages = Math.ceil(total / limit)
  
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  )
}