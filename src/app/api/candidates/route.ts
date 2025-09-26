import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GitHubAnalyzer } from '@/lib/github-analyzer'
import { 
  candidateSchema, 
  candidateQuerySchema,
  type CandidateInput,
  type PaginationInput
} from '@/lib/validation'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationErrorResponse, 
  createUnauthorizedResponse,
  createForbiddenResponse,
  createServerErrorResponse
} from '@/lib/api-response'
import { validateRequest, validateQueryParams } from '@/lib/validation-utils'
import { logger } from '@/lib/logger'
import { getEnvVar } from '@/lib/env'
import { randomUUID } from 'crypto'

// Define CandidateStatus enum if not already defined in your schema
export enum CandidateStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEWING = 'INTERVIEWING',
  OFFERED = 'OFFERED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  try {
    // Validate authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      logger.warn('Unauthorized access attempt to candidates endpoint', { requestId })
      return createErrorResponse('Unauthorized', 401)
    }

    // Check user role
    if (!['ADMIN', 'RECRUITER', 'INTERVIEWER'].includes(session.user.role)) {
      logger.warn('Forbidden access attempt to candidates endpoint', { 
        requestId, 
        userId: session.user.id, 
        role: session.user.role 
      })
      return createErrorResponse('Forbidden', 403)
    }

    // Validate query parameters
    const url = new URL(request.url)
    const queryValidation = validateQueryParams<PaginationInput & { search?: string; status?: string; experience?: string }>(
      url,
      candidateQuerySchema
    )

    if (!queryValidation.success) {
      return queryValidation.response
    }

    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', search, status, experience } = queryValidation.data
    
    // Build the where clause with type safety
    const where: any = {
      organizationId: session.user.organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { position: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status && { status }),
      ...(experience && { experience })
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute queries in parallel
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          interviews: {
            select: {
              id: true,
              status: true,
              score: true,
              scheduledAt: true,
              type: true
            },
            orderBy: { scheduledAt: 'desc' }
          },
          githubAnalysis: {
            select: {
              overallScore: true,
              activityScore: true,
              codeQualityScore: true,
              collaborationScore: true,
              consistencyScore: true,
              analyzedAt: true
            },
            orderBy: { analyzedAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.candidate.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Log successful request
    logger.info('Candidates retrieved successfully', {
      requestId,
      userId: session.user.id,
      count: candidates.length,
      total,
      page,
      limit,
      duration: Date.now() - startTime
    })

    // Return paginated response
    return createSuccessResponse({
      candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    })
  } catch (error) {
    // Log the error
    logger.error('Error fetching candidates', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime
    })
    
    // Return appropriate error response
    return createServerErrorResponse(error instanceof Error ? error : new Error('Failed to fetch candidates'))
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  try {
    // Validate authentication and authorization
    const session = await getServerSession(authOptions)
    if (!session) {
      logger.warn('Unauthorized attempt to create candidate', { requestId })
      return createErrorResponse('Unauthorized', 401)
    }

    // Check user role
    if (!['ADMIN', 'RECRUITER'].includes(session.user.role)) {
      logger.warn('Forbidden attempt to create candidate', { 
        requestId, 
        userId: session.user.id, 
        role: session.user.role 
      })
      return createErrorResponse('Forbidden', 403)
    }

    // Validate request body
    const validation = await validateRequest<CandidateInput>(request, candidateSchema)
    if (!validation.success) {
      return validation.response
    }

    const data = validation.data
    const { githubUrl, ...candidateData } = data

    // Check for existing candidate with the same email in the same organization
    const existingCandidate = await prisma.candidate.findFirst({
      where: { 
        email: data.email,
        organizationId: session.user.organizationId
      }
    })

    if (existingCandidate) {
      logger.warn('Attempt to create duplicate candidate', {
        requestId,
        email: data.email,
        organizationId: session.user.organizationId
      })
      return createErrorResponse(
        'A candidate with this email already exists in your organization',
        409,
        'DUPLICATE_CANDIDATE'
      )
    }

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        ...candidateData,
        skills: JSON.stringify(data.skills),
        organizationId: session.user.organizationId,
        status: CandidateStatus.APPLIED,
        createdBy: session.user.id
      }
    })

    // Process GitHub profile analysis in the background if URL is provided
    if (githubUrl && githubUrl.trim()) {
      try {
        // Process GitHub analysis in the background without awaiting
        const githubAnalyzer = new GitHubAnalyzer()
        // Extract username from GitHub URL
        const githubUsername = githubUrl.split('/').pop() || ''
        githubAnalyzer.analyzeCandidate(githubUsername)
          .then(analysis => {
            // Save analysis to database
            return prisma.gitHubAnalysis.create({
              data: {
                candidateId: candidate.id,
                organizationId: session.user.organizationId,
                username: analysis.profile.login,
                profileData: JSON.stringify(analysis.profile),
                repositories: JSON.stringify(analysis.repositories),
                contributions: JSON.stringify(analysis.collaborationMetrics),
                languageStats: JSON.stringify(analysis.languageStats),
                activityScore: analysis.overallScores.activity,
                codeQualityScore: analysis.overallScores.codeQuality,
                collaborationScore: analysis.overallScores.collaboration,
                consistencyScore: analysis.overallScores.consistency,
                overallScore: analysis.overallScores.overall,
                insights: JSON.stringify({
                  insights: analysis.insights,
                  recommendations: analysis.recommendations
                })
              }
            })
          })
          .catch(error => {
          logger.error('Error in background GitHub analysis', {
            requestId,
            candidateId: candidate.id,
            githubUrl,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        })
      } catch (error) {
        logger.error('Error starting GitHub analysis', {
          requestId,
          candidateId: candidate.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        // Continue without GitHub analysis if it fails to start
      }
    }

    // Return the created candidate
    const candidateWithDetails = await prisma.candidate.findUnique({
      where: { id: candidate.id },
      include: {
        githubAnalysis: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        },
        interviews: {
          select: {
            id: true,
            status: true,
            scheduledAt: true
          }
        }
      }
    })
    
    return createSuccessResponse({
      data: candidateWithDetails,
      message: 'Candidate created successfully',
      status: 201
    })
  } catch (error) {
    console.error('Error creating candidate:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return createErrorResponse('Candidate with this email already exists', 409)
    }
    return createErrorResponse('Internal server error', 500)
  }
}