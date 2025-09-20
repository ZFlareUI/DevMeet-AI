import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get basic counts
    const [
      totalCandidates,
      totalInterviews,
      completedInterviews,
      recentCandidates,
      recentInterviews,
      interviews
    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.interview.count(),
      prisma.interview.count({ where: { status: 'COMPLETED' } }),
      prisma.candidate.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          position: true,
          status: true,
          createdAt: true
        }
      }),
      prisma.interview.findMany({
        take: 5,
        orderBy: { scheduledAt: 'desc' },
        include: {
          candidate: {
            select: { name: true }
          }
        }
      }),
      prisma.interview.findMany({
        where: {
          status: 'COMPLETED',
          score: { not: null }
        },
        select: {
          score: true,
          candidate: {
            select: { position: true }
          }
        }
      })
    ])

    // Calculate average score
    const avgScore = interviews.length > 0 
      ? interviews.reduce((sum: number, interview) => sum + (interview.score || 0), 0) / interviews.length
      : 0

    // Calculate hire rate (assuming score >= 8 is hired)
    const hiredCount = interviews.filter((interview) => (interview.score || 0) >= 8).length
    const hireRate = completedInterviews > 0 ? (hiredCount / completedInterviews) * 100 : 0

    // Score distribution
    const scoreRanges = [
      { range: '9.0 - 10.0', min: 9, max: 10 },
      { range: '8.0 - 8.9', min: 8, max: 8.9 },
      { range: '7.0 - 7.9', min: 7, max: 7.9 },
      { range: '6.0 - 6.9', min: 6, max: 6.9 },
      { range: '0.0 - 5.9', min: 0, max: 5.9 }
    ]

    const scoreDistribution = scoreRanges.map(range => ({
      range: range.range,
      count: interviews.filter((interview) => {
        const score = interview.score || 0
        return score >= range.min && score <= range.max
      }).length
    }))

    // Position statistics
    const positionGroups = interviews.reduce((acc: Record<string, { scores: number[], count: number }>, interview) => {
      const position = interview.candidate?.position || 'Unknown'
      if (!acc[position]) {
        acc[position] = { scores: [], count: 0 }
      }
      acc[position].scores.push(interview.score || 0)
      acc[position].count++
      return acc
    }, {})

    const positionStats = Object.entries(positionGroups).map(([position, data]) => ({
      position,
      count: data.count,
      avgScore: data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length
    }))

    // Get all candidates with position stats
    const allCandidates = await prisma.candidate.findMany({
      select: { position: true }
    })

    // Calculate position stats including all candidates
    const allPositionGroups = allCandidates.reduce((acc: Record<string, number>, candidate) => {
      const position = candidate.position || 'Unknown'
      acc[position] = (acc[position] || 0) + 1
      return acc
    }, {})

    const completePositionStats = Object.entries(allPositionGroups).map(([position, count]) => {
      const interviewData = positionGroups[position]
      return {
        position,
        count,
        avgScore: interviewData ? 
          interviewData.scores.reduce((sum: number, score: number) => sum + score, 0) / interviewData.scores.length : 0
      }
    })

    const analytics = {
      totalCandidates,
      totalInterviews,
      completedInterviews,
      avgScore,
      hireRate,
      recentCandidates,
      recentInterviews,
      scoreDistribution,
      positionStats: completePositionStats
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}