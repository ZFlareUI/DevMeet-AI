import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            githubAnalysis: {
              orderBy: { analyzedAt: 'desc' },
              take: 1
            }
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
      }
    })

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const interviewData = {
      ...interview,
      techStack: JSON.parse(interview.techStack),
      questions: JSON.parse(interview.questions)
    }

    return NextResponse.json({ interview: interviewData })
  } catch (error) {
    console.error('Error fetching interview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const {
      title,
      description,
      status,
      scheduledAt,
      startedAt,
      completedAt,
      duration,
      questions,
      notes,
      score,
      recommendation
    } = data

    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt)
    if (startedAt !== undefined) updateData.startedAt = new Date(startedAt)
    if (completedAt !== undefined) updateData.completedAt = new Date(completedAt)
    if (duration !== undefined) updateData.duration = duration
    if (questions !== undefined) updateData.questions = JSON.stringify(questions)
    if (notes !== undefined) updateData.notes = notes
    if (score !== undefined) updateData.score = score
    if (recommendation !== undefined) updateData.recommendation = recommendation

    const interview = await prisma.interview.update({
      where: { id: params.id },
      data: updateData,
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
        assessments: true
      }
    })

    return NextResponse.json({ interview })
  } catch (error) {
    console.error('Error updating interview:', error)
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.interview.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting interview:', error)
    return NextResponse.json(
      { error: 'Failed to delete interview' },
      { status: 500 }
    )
  }
}