import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GitHubAnalyzer } from '@/lib/github-analyzer'
import { candidateSchema, candidateQuerySchema, validateInput, createErrorResponse, createSuccessResponse } from '@/lib/validation'
import { CandidateStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Only admins, recruiters, and interviewers can view candidates
    if (!['ADMIN', 'RECRUITER', 'INTERVIEWER'].includes(session.user.role)) {
      return createErrorResponse('Forbidden', 403)
    }

    const { searchParams } = new URL(request.url)
    const queryParams: any = {}
    
    // Extract query parameters
    queryParams.page = parseInt(searchParams.get('page') || '1')
    queryParams.limit = parseInt(searchParams.get('limit') || '10')
    queryParams.sortBy = searchParams.get('sortBy') || undefined
    queryParams.sortOrder = searchParams.get('sortOrder') || 'desc'
    queryParams.search = searchParams.get('search') || undefined
    queryParams.status = searchParams.get('status') || undefined
    queryParams.position = searchParams.get('position') || undefined
    queryParams.experience = searchParams.get('experience') || undefined

    const validation = validateInput(candidateQuerySchema, queryParams)
    if (!validation.success) {
      return createErrorResponse(`Invalid query parameters: ${validation.errors.join(', ')}`)
    }

    const { page, limit, sortBy, sortOrder, search, status, position, experience } = validation.data

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (position) {
      where.position = { contains: position, mode: 'insensitive' }
    }

    if (experience) {
      where.experience = { contains: experience, mode: 'insensitive' }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build orderBy
    const orderBy: any = {}
    if (sortBy && ['createdAt', 'name', 'position', 'status'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    // Fetch candidates with pagination
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy,
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

    return createSuccessResponse({
      candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Only admins and recruiters can create candidates
    if (!['ADMIN', 'RECRUITER'].includes(session.user.role)) {
      return createErrorResponse('Forbidden', 403)
    }

    const body = await request.json()
    const validation = validateInput(candidateSchema, body)
    
    if (!validation.success) {
      return createErrorResponse(`Validation failed: ${validation.errors.join(', ')}`)
    }

    const data = validation.data

    // Check if candidate with email already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { email: data.email }
    })

    if (existingCandidate) {
      return createErrorResponse('Candidate with this email already exists', 409)
    }

    // Validate GitHub URL if provided
    if (data.githubUrl && data.githubUrl.trim()) {
      try {
        new URL(data.githubUrl)
        if (!data.githubUrl.includes('github.com')) {
          return createErrorResponse('GitHub URL must be a valid GitHub profile URL')
        }
      } catch {
        return createErrorResponse('Invalid GitHub URL format')
      }
    }

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        experience: data.experience,
        skills: JSON.stringify(data.skills),
        githubUsername: data.githubUsername,
        githubUrl: data.githubUrl || (data.githubUsername ? `https://github.com/${data.githubUsername}` : null),
        resume: data.resume,
        coverLetter: data.coverLetter,
        status: CandidateStatus.APPLIED,
        createdBy: session.user.id
      }
    })

    // Analyze GitHub profile if username provided
    if (data.githubUsername) {
      try {
        const analyzer = new GitHubAnalyzer()
        const analysis = await analyzer.analyzeCandidate(data.githubUsername)
        
        await prisma.gitHubAnalysis.create({
          data: {
            candidateId: candidate.id,
            username: data.githubUsername,
            profileData: JSON.stringify(analysis.profile),
            repositories: JSON.stringify(analysis.repositories),
            contributions: JSON.stringify(analysis.activityMetrics),
            languageStats: JSON.stringify(analysis.languageStats),
            activityScore: analysis.overallScores.activity,
            codeQualityScore: analysis.overallScores.codeQuality,
            collaborationScore: analysis.overallScores.collaboration,
            consistencyScore: analysis.overallScores.consistency,
            overallScore: analysis.overallScores.overall,
            insights: JSON.stringify(analysis.insights)
          }
        })

        console.log(`GitHub analysis completed for candidate: ${candidate.id}`)
      } catch (error) {
        console.error('Error analyzing GitHub profile:', error)
        // Continue without GitHub analysis if it fails
      }
    }

    // Return candidate with fresh data
    const candidateWithAnalysis = await prisma.candidate.findUnique({
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

    return createSuccessResponse(candidateWithAnalysis, 'Candidate created successfully')
  } catch (error) {
    console.error('Error creating candidate:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return createErrorResponse('Candidate with this email already exists', 409)
    }
    return createErrorResponse('Internal server error', 500)
  }
}