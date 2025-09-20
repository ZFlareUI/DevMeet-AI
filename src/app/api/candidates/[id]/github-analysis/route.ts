import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GitHubAnalyzer } from '@/lib/github-analyzer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const candidate = await prisma.candidate.findUnique({
      where: { id }
    })

    if (!candidate || !candidate.githubUsername) {
      return NextResponse.json(
        { error: 'Candidate not found or no GitHub username' },
        { status: 404 }
      )
    }

    const analyzer = new GitHubAnalyzer()
    const analysis = await analyzer.analyzeCandidate(candidate.githubUsername)
    
    // Delete old analysis
    await prisma.gitHubAnalysis.deleteMany({
      where: { candidateId: id }
    })

    // Create new analysis
    const githubAnalysis = await prisma.gitHubAnalysis.create({
      data: {
        candidateId: id,
        username: candidate.githubUsername,
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

    return NextResponse.json({ 
      analysis: githubAnalysis,
      detailedAnalysis: analysis 
    })
  } catch (error) {
    console.error('Error analyzing GitHub profile:', error)
    return NextResponse.json(
      { error: 'Failed to analyze GitHub profile' },
      { status: 500 }
    )
  }
}