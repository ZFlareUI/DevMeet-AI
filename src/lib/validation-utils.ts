import { z } from 'zod'
import { NextResponse } from 'next/server'
import { ApiResponse } from './api-response'

/**
 * Sanitizes input by removing potentially dangerous characters
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return input
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
}

/**
 * Validates and sanitizes an object's string properties
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const result: Record<string, any> = { ...obj }
  
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = sanitizeInput(result[key])
    } else if (Array.isArray(result[key])) {
      result[key] = result[key].map((item: any) => 
        typeof item === 'string' ? sanitizeInput(item) : item
      )
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = sanitizeObject(result[key])
    }
  }
  
  return result as T
}

/**
 * Validates input against a Zod schema and returns a standardized response
 */
export const validateWithSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse<ApiResponse> } => {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }))
    
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors
          }
        },
        { status: 422 }
      )
    }
  }
  
  return { success: true, data: result.data }
}

/**
 * Validates and sanitizes request body against a Zod schema
 */
export const validateRequest = async <T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ApiResponse> }> => {
  try {
    const body = await request.json()
    const sanitizedBody = sanitizeObject(body)
    return validateWithSchema(schema, sanitizedBody)
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body'
          }
        },
        { status: 400 }
      )
    }
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export const validateQueryParams = <T>(
  url: URL,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse<ApiResponse> } => {
  const params: Record<string, string | string[]> = {}
  
  url.searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value)
      } else {
        params[key] = [params[key] as string, value]
      }
    } else {
      params[key] = value
    }
  })
  
  // Convert single-item arrays to single values for schema validation
  const processedParams: Record<string, any> = {}
  for (const [key, value] of Object.entries(params)) {
    processedParams[key] = Array.isArray(value) && value.length === 1 ? value[0] : value
  }
  
  return validateWithSchema(schema, processedParams)
}

/**
 * Validates file uploads
 */
export const validateFileUpload = (file: File, options: {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}): { valid: true } | { valid: false; error: string } => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB` 
    }
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
    }
  }
  
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !allowedExtensions.includes(extension)) {
      return { 
        valid: false, 
        error: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}` 
      }
    }
  }
  
  return { valid: true }
}

/**
 * Validates and parses JSON strings
 */
export const safeJsonParse = <T = any>(jsonString: string): { success: true; data: T } | { success: false; error: Error } => {
  try {
    const parsed = JSON.parse(jsonString)
    return { success: true, data: parsed }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Invalid JSON string') 
    }
  }
}
