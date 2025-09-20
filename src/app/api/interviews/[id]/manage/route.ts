import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AIInterviewer } from '@/lib/ai-interviewer'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { action } = data

    const interview = await prisma.interview.findUnique({
      where: { id: params.id }
    })

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    let updatedInterview

    switch (action) {
      case 'start':
        updatedInterview = await prisma.interview.update({
          where: { id: params.id },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date()
          }
        })
        break

      case 'complete':
        const aiInterviewer = new AIInterviewer()
        const questions = JSON.parse(interview.questions)
        
        // Generate final assessment
        const summary = await aiInterviewer.generateInterviewSummary(
          questions.questions || [],
          questions.responses || []
        )

        updatedInterview = await prisma.interview.update({
          where: { id: params.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            duration: interview.startedAt ? 
              Math.round((new Date().getTime() - interview.startedAt.getTime()) / (1000 * 60)) : null,
            score: summary.overallScore,
            recommendation: summary.summary
          }
        })

        // Create assessment record
        await prisma.assessment.create({
          data: {
            interviewId: params.id,
            candidateId: interview.candidateId,
            assessorId: interview.interviewerId,
            technicalScore: summary.overallScore,
            communicationScore: summary.overallScore * 0.9, // Estimate
            problemSolvingScore: summary.overallScore * 1.1, // Estimate
            cultureScore: summary.overallScore * 0.8, // Estimate
            overallScore: summary.overallScore,
            feedback: summary.summary,
            recommendation: summary.recommendation.toUpperCase().replace(/ /g, '_') as any,
            strengths: JSON.stringify(summary.strengths),
            weaknesses: JSON.stringify(summary.weaknesses)
          }
        })
        break

      case 'cancel':
        updatedInterview = await prisma.interview.update({
          where: { id: params.id },
          data: {
            status: 'CANCELLED'
          }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ interview: updatedInterview })
  } catch (error) {
    console.error('Error managing interview:', error)
    return NextResponse.json(
      { error: 'Failed to manage interview' },
      { status: 500 }
    )
  }
}