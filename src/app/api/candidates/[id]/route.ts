import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GitHubAnalyzer } from '@/lib/github-analyzer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        interviews: {
          include: {
            assessments: true,
            interviewer: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        githubAnalysis: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        },
        assessments: {
          include: {
            assessor: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ candidate })
  } catch (error) {
    console.error('Error fetching candidate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
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
      name,
      email,
      phone,
      githubUsername,
      position,
      experience,
      skills,
      status
    } = data

    const candidate = await prisma.candidate.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone,
        githubUsername,
        githubUrl: githubUsername ? `https://github.com/${githubUsername}` : null,
        position,
        experience,
        skills: JSON.stringify(skills || []),
        status
      },
      include: {
        githubAnalysis: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        }
      }
    })

    return NextResponse.json({ candidate })
  } catch (error) {
    console.error('Error updating candidate:', error)
    return NextResponse.json(
      { error: 'Failed to update candidate' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.candidate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting candidate:', error)
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    )
  }
}