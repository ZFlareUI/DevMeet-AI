import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AIInterviewer } from '@/lib/ai-interviewer'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { response, questionIndex } = data

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
      include: {
        candidate: {
          include: {
            githubAnalysis: {
              orderBy: { analyzedAt: 'desc' },
              take: 1
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

    const questions = JSON.parse(interview.questions)
    const currentQuestion = questions.questions[questionIndex]

    if (!currentQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Evaluate the response
    const aiInterviewer = new AIInterviewer()
    const githubContext = interview.candidate.githubAnalysis[0] ? 
      `GitHub Analysis - Overall Score: ${interview.candidate.githubAnalysis[0].overallScore}/10` : ''
    
    const evaluation = await aiInterviewer.evaluateResponse(
      currentQuestion,
      response,
      githubContext
    )

    // Update the questions data
    questions.responses = questions.responses || []
    questions.responses[questionIndex] = {
      questionId: currentQuestion.id,
      response,
      timestamp: new Date(),
      score: evaluation.score,
      feedback: evaluation.feedback
    }

    questions.currentIndex = questionIndex + 1

    // Generate follow-up question if needed
    let followUpQuestion = null
    if (evaluation.followUp) {
      followUpQuestion = {
        id: `followup_${questionIndex}`,
        question: evaluation.followUp,
        type: 'technical',
        difficulty: currentQuestion.difficulty,
        isFollowUp: true
      }
      
      // Insert follow-up question after current question
      questions.questions.splice(questionIndex + 1, 0, followUpQuestion)
    }

    // Save updated interview
    await prisma.interview.update({
      where: { id: params.id },
      data: {
        questions: JSON.stringify(questions)
      }
    })

    return NextResponse.json({
      evaluation,
      followUpQuestion,
      nextQuestionIndex: questions.currentIndex,
      totalQuestions: questions.questions.length
    })
  } catch (error) {
    console.error('Error processing response:', error)
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    )
  }
}