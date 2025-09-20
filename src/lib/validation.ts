import { z } from 'zod'

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE']).optional(),
})

// Candidate validation schemas
export const candidateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  position: z.string().min(2, 'Position must be at least 2 characters'),
  experience: z.string().min(1, 'Experience is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  githubUsername: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  resume: z.string().optional(),
  coverLetter: z.string().optional(),
})

export const candidateUpdateSchema = candidateSchema.partial()

// Interview validation schemas
export const interviewSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  candidateId: z.string().min(1, 'Candidate is required'),
  interviewerId: z.string().min(1, 'Interviewer is required'),
  type: z.enum(['TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN']),
  scheduledAt: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Interview must be scheduled in the future'
  }),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(180, 'Duration cannot exceed 3 hours').optional(),
  aiPersonality: z.enum(['professional', 'friendly', 'technical', 'casual']).optional(),
  techStack: z.array(z.string()).optional(),
  difficultyLevel: z.enum(['junior', 'intermediate', 'senior']).optional(),
})

export const interviewUpdateSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  score: z.number().min(0).max(10).optional(),
  feedback: z.string().optional(),
  notes: z.string().optional(),
})

// Assessment validation schemas
export const assessmentSchema = z.object({
  interviewId: z.string().min(1, 'Interview ID is required'),
  candidateId: z.string().min(1, 'Candidate ID is required'),
  assessorId: z.string().min(1, 'Assessor ID is required'),
  technicalScore: z.number().min(0).max(10),
  communicationScore: z.number().min(0).max(10),
  problemSolvingScore: z.number().min(0).max(10),
  cultureScore: z.number().min(0).max(10),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  recommendation: z.enum(['HIRE', 'NO_HIRE', 'MAYBE']),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
})

// GitHub analysis validation
export const githubAnalysisSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  username: z.string().min(1, 'GitHub username is required'),
})

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
})

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Query parameter schemas
export const candidateQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['APPLIED', 'INTERVIEWING', 'HIRED', 'REJECTED']).optional(),
  position: z.string().optional(),
  experience: z.string().optional(),
}).merge(paginationSchema)

export const interviewQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  type: z.enum(['TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN']).optional(),
  candidateId: z.string().optional(),
  interviewerId: z.string().optional(),
  from: z.string().optional(), // Date filter
  to: z.string().optional(),   // Date filter
}).merge(paginationSchema)

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CandidateInput = z.infer<typeof candidateSchema>
export type CandidateUpdateInput = z.infer<typeof candidateUpdateSchema>
export type InterviewInput = z.infer<typeof interviewSchema>
export type InterviewUpdateInput = z.infer<typeof interviewUpdateSchema>
export type AssessmentInput = z.infer<typeof assessmentSchema>
export type GitHubAnalysisInput = z.infer<typeof githubAnalysisSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type CandidateQueryInput = z.infer<typeof candidateQuerySchema>
export type InterviewQueryInput = z.infer<typeof interviewQuerySchema>

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Validation failed']
    }
  }
}

// Error response helper
export function createErrorResponse(message: string, status: number = 400) {
  return Response.json(
    { success: false, error: message },
    { status }
  )
}

// Success response helper
export function createSuccessResponse(data?: any, message?: string) {
  return Response.json({
    success: true,
    message,
    data
  })
}

// Database entity types (including server fields)
export interface Candidate {
  id: string
  name: string
  email: string
  githubUrl?: string | null
  githubScore?: number | null
  status: 'active' | 'hired' | 'rejected' | 'withdrawn'
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Interview {
  id: string
  title: string
  candidateId: string
  type: 'technical' | 'behavioral' | 'system-design' | 'cultural-fit'
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  scheduledAt: Date
  duration?: number | null
  questions?: any | null // JSON
  responses?: any | null // JSON
  score?: number | null
  feedback?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Assessment {
  id: string
  interviewId: string
  technicalScore?: number | null
  communicationScore?: number | null
  problemSolvingScore?: number | null
  overallScore?: number | null
  feedback: string
  createdAt: Date
  updatedAt: Date
}