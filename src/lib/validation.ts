import { z } from 'zod'
import { NextResponse } from 'next/server'

const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['INTERVIEWER', 'ADMIN', 'CANDIDATE']).default('INTERVIEWER'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const candidateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
  resume: z.string().url('Invalid resume URL').optional(),
  githubUrl: z.string().url('Invalid GitHub URL').optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional(),
  skills: z.array(z.string().min(1, 'Skill cannot be empty')).min(1, 'At least one skill is required').max(20, 'Cannot exceed 20 skills'),
  experience: z.enum(['0-1', '1-3', '3-5', '5-10', '10+'], { message: 'Please select a valid experience range' }),
  position: z.string().min(2, 'Position must be at least 2 characters').max(100, 'Position cannot exceed 100 characters'),
  expectedSalary: z.number().min(0, 'Salary cannot be negative').max(10000000, 'Salary seems unrealistic').optional(),
  availability: z.enum(['immediate', 'within-1-week', 'within-2-weeks', 'within-1-month', 'other']).optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
})

export const candidateUpdateSchema = candidateSchema.partial()

export const interviewSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  interviewerId: z.string().min(1, 'Interviewer ID is required'),
  position: z.string().min(2, 'Position must be at least 2 characters').max(100, 'Position cannot exceed 100 characters'),
  type: z.enum(['TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'CODING', 'HR']),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  scheduledAt: z.string().datetime('Invalid date format').refine((date) => new Date(date) > new Date(), 'Scheduled time must be in the future').transform((date) => new Date(date)),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(300, 'Duration cannot exceed 5 hours').default(60),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  questions: z.array(z.string()).optional(),
  aiPersonality: z.enum(['professional', 'friendly', 'technical', 'casual']).optional(),
  techStack: z.array(z.string()).optional(),
  difficultyLevel: z.enum(['junior', 'intermediate', 'senior']).optional(),
})

export const assessmentSchema = z.object({
  interviewId: z.string().min(1, 'Interview ID is required'),
  candidateId: z.string().min(1, 'Candidate ID is required'),
  assessorId: z.string().min(1, 'Assessor ID is required'),
  technicalScore: z.number().min(0, 'Score cannot be negative').max(10, 'Score cannot exceed 10'),
  communicationScore: z.number().min(0).max(10),
  problemSolvingScore: z.number().min(0).max(10),
  cultureScore: z.number().min(0).max(10),
  overallScore: z.number().min(0).max(10),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters').max(5000, 'Feedback cannot exceed 5000 characters'),
  recommendation: z.enum(['HIRE', 'NO_HIRE', 'MAYBE', 'SECOND_ROUND']),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
})

export const githubAnalysisSchema = z.object({
  username: z.string().min(1, 'GitHub username is required').regex(/^[a-zA-Z0-9-_]+$/, 'Invalid GitHub username format'),
  repositoryLimit: z.number().min(1, 'Must analyze at least 1 repository').max(50, 'Cannot analyze more than 50 repositories').default(10),
  includePrivate: z.boolean().default(false),
})

export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').optional(),
  filters: z.record(z.string(), z.any()).optional(),
}).merge(paginationSchema)

export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  size: z.number().min(1, 'File cannot be empty').max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  mimetype: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/gif'], { message: 'Unsupported file type' }),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CandidateInput = z.infer<typeof candidateSchema>
export type CandidateUpdateInput = z.infer<typeof candidateUpdateSchema>
export type InterviewInput = z.infer<typeof interviewSchema>
export type AssessmentInput = z.infer<typeof assessmentSchema>
export type GitHubAnalysisInput = z.infer<typeof githubAnalysisSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type CandidateQueryInput = z.infer<typeof candidateQuerySchema>

// Database entity types (for components that need them)
export interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  position: string
  experience: string
  skills: string
  githubUsername?: string
  githubUrl?: string
  linkedinUrl?: string
  resume?: string
  expectedSalary?: number
  availability?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Interview {
  id: string
  candidateId: string
  interviewerId: string
  position: string
  type: string
  status: string
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  duration?: number
  notes?: string
  score?: number
  questions?: string
  techStack?: string
  aiPersonality?: string
  difficultyLevel?: string
  createdAt: Date
  updatedAt: Date
}

export type ValidationError = {
  path: string
  message: string
  code: string
}

export function formatValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }))
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; errors: ValidationError[] } => {
    try {
      const validatedData = schema.parse(data)
      return { success: true, data: validatedData }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: formatValidationErrors(error) }
      }
      return { success: false, errors: [{ path: 'unknown', message: 'Validation failed', code: 'unknown' }] }
    }
  }
}

export const emailValidation = z.string().email('Invalid email address')
export const passwordValidation = passwordSchema
export const phoneValidation = z.string().regex(phoneRegex, 'Invalid phone number format')
export const urlValidation = z.string().url('Invalid URL format')
export const dateValidation = z.string().datetime('Invalid date format')
export const positiveNumberValidation = z.number().min(0, 'Must be a positive number')
export const requiredStringValidation = z.string().min(1, 'This field is required')

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '')
}

export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

// Additional validation schemas
export const candidateQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.enum(['0-1', '1-3', '3-5', '5-10', '10+']).optional(),
  status: z.enum(['APPLIED', 'SCREENING', 'INTERVIEWING', 'ASSESSMENT', 'OFFERED', 'HIRED', 'REJECTED']).optional(),
  sortBy: z.enum(['createdAt', 'name', 'experience']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Helper functions for API responses
export const createErrorResponse = (message: string, status: number = 400, details?: unknown) => {
  return NextResponse.json({
    success: false,
    error: message,
    details
  }, { status })
}

export const createSuccessResponse = (data: unknown, message?: string, status: number = 200) => {
  return NextResponse.json({
    success: true,
    data,
    message
  }, { status })
}

// Generic validation function
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  try {
    return { success: true, data: schema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatValidationErrors(error) }
    }
    return { success: false, errors: [{ message: 'Validation failed', code: 'unknown' }] }
  }
}
