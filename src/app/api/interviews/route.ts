import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIInterviewer } from '@/lib/ai-interviewer'

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const interviews = await prisma.interview.findMany({
      where: {
        organizationId: session.user.organizationId
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            githubUsername: true
          }
        },
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
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ interviews })
  } catch (error) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const {
      title,
      description,
      candidateId,
      interviewerId,
      type,
      scheduledAt,
      aiPersonality,
      techStack,
      difficultyLevel
    } = data

    // Generate initial AI questions
    const aiInterviewer = new AIInterviewer()
    const questions = await aiInterviewer.generateQuestions(
      title || 'Software Engineer',
      techStack || ['JavaScript', 'Node.js'],
      difficultyLevel || 'intermediate',
      10
    )

    const interview = await prisma.interview.create({
      data: {
        title,
        description,
        candidateId,
        interviewerId,
        organizationId: session.user.organizationId,
        type: type || 'TECHNICAL',
        scheduledAt: new Date(scheduledAt),
        aiPersonality: aiPersonality || 'professional',
        techStack: JSON.stringify(techStack || []),
        difficultyLevel: difficultyLevel || 'intermediate',
        questions: JSON.stringify({
          questions,
          responses: [],
          currentIndex: 0
        }),
        status: 'SCHEDULED'
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            githubUsername: true
          }
        },
        interviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ interview })
  } catch (error) {
    console.error('Error creating interview:', error)
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    )
  }
}