import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        interview: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true,
                githubUsername: true
              }
            }
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            githubUsername: true
          }
        },
        assessor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Parse JSON fields
    const assessmentsWithParsedData = assessments.map(assessment => ({
      ...assessment,
      strengths: JSON.parse(assessment.strengths),
      weaknesses: JSON.parse(assessment.weaknesses)
    }))

    return NextResponse.json({ assessments: assessmentsWithParsedData })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const {
      interviewId,
      candidateId,
      assessorId,
      technicalScore,
      communicationScore,
      problemSolvingScore,
      cultureScore,
      overallScore,
      feedback,
      recommendation,
      strengths,
      weaknesses
    } = data

    const assessment = await prisma.assessment.create({
      data: {
        interviewId,
        candidateId,
        assessorId,
        organizationId: (session.user as any).organizationId,
        technicalScore,
        communicationScore,
        problemSolvingScore,
        cultureScore,
        overallScore,
        feedback,
        recommendation,
        strengths: JSON.stringify(strengths || []),
        weaknesses: JSON.stringify(weaknesses || [])
      },
      include: {
        interview: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true
              }
            }
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true
          }
        },
        assessor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    )
  }
}