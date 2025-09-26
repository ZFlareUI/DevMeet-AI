import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { candidateUpdateSchema, validateInput, createErrorResponse, createSuccessResponse } from '@/lib/validation'
import { GitHubAnalyzer } from '@/lib/github-analyzer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Only admins, recruiters, and interviewers can view candidate details
    if (!['ADMIN', 'RECRUITER', 'INTERVIEWER'].includes(session.user.role)) {
      return createErrorResponse('Forbidden', 403)
    }

    const candidateId = id

    if (!candidateId) {
      return createErrorResponse('Candidate ID is required')
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        interviews: {
          include: {
            interviewer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            assessments: {
              include: {
                assessor: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        githubAnalysis: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        },
        assessments: {
          include: {
            assessor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    if (!candidate) {
      return createErrorResponse('Candidate not found', 404)
    }

    // Parse skills JSON
    let skills = []
    try {
      skills = JSON.parse(candidate.skills || '[]')
    } catch {
      skills = []
    }

    const candidateData = {
      ...candidate,
      skills
    }

    return createSuccessResponse(candidateData)
  } catch (error) {
    console.error('Error fetching candidate:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Only admins and recruiters can update candidates
    if (!['ADMIN', 'RECRUITER'].includes(session.user.role)) {
      return createErrorResponse('Forbidden', 403)
    }

    if (!candidateId) {
      return createErrorResponse('Candidate ID is required')
    }

    const body = await request.json()
    const validation = validateInput(candidateUpdateSchema, body)
    
    if (!validation.success) {
      return createErrorResponse(`Validation failed: ${validation.errors?.join(', ') || 'Unknown validation error'}`)
    }

    const data = validation.data

    // Check if candidate exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    })

    if (!existingCandidate) {
      return createErrorResponse('Candidate not found', 404)
    }

    // Check if email is being changed and if it conflicts
    if (data?.email && data.email !== existingCandidate.email) {
      const emailConflict = await prisma.candidate.findFirst({
        where: {
          email: data.email,
          id: { not: candidateId }
        }
      })

      if (emailConflict) {
        return createErrorResponse('Email already exists for another candidate', 409)
      }
    }

    // Validate GitHub URL if provided
    if (data?.githubUrl && data.githubUrl.trim()) {
      try {
        new URL(data.githubUrl)
        if (!data.githubUrl.includes('github.com')) {
          return createErrorResponse('GitHub URL must be a valid GitHub profile URL')
        }
      } catch {
        return createErrorResponse('Invalid GitHub URL format')
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (data?.name) updateData.name = data.name
    if (data?.email) updateData.email = data.email
    if (data?.phone !== undefined) updateData.phone = data.phone
    if (data?.position) updateData.position = data.position
    if (data?.experience) updateData.experience = data.experience
    if (data?.skills) updateData.skills = JSON.stringify(data.skills)
    if (data?.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl
    if (data?.githubUrl !== undefined) updateData.githubUrl = data.githubUrl
    if (data?.resume !== undefined) updateData.resume = data.resume
    if (data?.expectedSalary !== undefined) updateData.expectedSalary = data.expectedSalary
    if (data?.availability !== undefined) updateData.availability = data.availability
    if (data?.notes !== undefined) updateData.notes = data.notes

    // Update candidate
    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: updateData,
      include: {
        interviews: {
          include: {
            interviewer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        githubAnalysis: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        }
      }
    })

    return createSuccessResponse(updatedCandidate, 'Candidate updated successfully')
  } catch (error) {
    console.error('Error updating candidate:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Only admins can delete candidates
    if (session.user.role !== 'ADMIN') {
      return createErrorResponse('Forbidden', 403)
    }

    const candidateId = id

    if (!candidateId) {
      return createErrorResponse('Candidate ID is required')
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        interviews: true,
        assessments: true,
        githubAnalysis: true
      }
    })

    if (!candidate) {
      return createErrorResponse('Candidate not found', 404)
    }

    // Check if candidate has ongoing interviews
    const ongoingInterviews = candidate.interviews.filter(
      interview => interview.status === 'SCHEDULED' || interview.status === 'IN_PROGRESS'
    )

    if (ongoingInterviews.length > 0) {
      return createErrorResponse('Cannot delete candidate with ongoing interviews', 400)
    }

    // Delete related records first (if not handled by cascade)
    await prisma.$transaction([
      prisma.gitHubAnalysis.deleteMany({ where: { candidateId } }),
      prisma.assessment.deleteMany({ where: { candidateId } }),
      prisma.interview.deleteMany({ where: { candidateId } }),
      prisma.candidate.delete({ where: { id: candidateId } })
    ])

    return createSuccessResponse(null, 'Candidate deleted successfully')
  } catch (error) {
    console.error('Error deleting candidate:', error)
    return createErrorResponse('Internal server error', 500)
  }
}