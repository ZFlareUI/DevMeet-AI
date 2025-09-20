import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GitHubAnalyzer } from '@/lib/github-analyzer'

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        interviews: {
          include: {
            assessments: true
          }
        },
        githubAnalysis: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ candidates })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      name,
      email,
      phone,
      githubUsername,
      position,
      experience,
      skills
    } = data

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        phone,
        githubUsername,
        githubUrl: githubUsername ? `https://github.com/${githubUsername}` : null,
        position,
        experience,
        skills: JSON.stringify(skills || []),
        status: 'APPLIED'
      }
    })

    // Analyze GitHub profile if username provided
    if (githubUsername) {
      try {
        const analyzer = new GitHubAnalyzer()
        const analysis = await analyzer.analyzeCandidate(githubUsername)
        
        await prisma.gitHubAnalysis.create({
          data: {
            candidateId: candidate.id,
            username: githubUsername,
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
      } catch (error) {
        console.error('Error analyzing GitHub profile:', error)
        // Continue without GitHub analysis if it fails
      }
    }

    // Return candidate with fresh GitHub analysis
    const candidateWithAnalysis = await prisma.candidate.findUnique({
      where: { id: candidate.id },
      include: {
        githubAnalysis: true
      }
    })

    return NextResponse.json({ candidate: candidateWithAnalysis })
  } catch (error) {
    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    )
  }
}