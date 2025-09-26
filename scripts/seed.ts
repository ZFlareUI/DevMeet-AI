import { PrismaClient, UserRole, CandidateStatus, InterviewType, InterviewStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo organization first
  const organization = await prisma.organization.upsert({
    where: { slug: 'devmeet-ai-demo' },
    update: {},
    create: {
      name: 'DevMeet AI Demo',
      slug: 'devmeet-ai-demo',
    }
  })
  console.log(`✅ Created organization: ${organization.name}`)

  // Create demo users
  const users = [
    {
      email: 'admin@devmeet.ai',
      name: 'Admin User',
      role: UserRole.ADMIN
    },
    {
      email: 'recruiter@devmeet.ai',
      name: 'Sarah Johnson',
      role: UserRole.RECRUITER
    },
    {
      email: 'interviewer@devmeet.ai',
      name: 'Mike Chen',
      role: UserRole.INTERVIEWER
    },
    {
      email: 'candidate@devmeet.ai',
      name: 'Alex Thompson',
      role: UserRole.CANDIDATE
    }
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        organizationId: organization.id,
        id: `user_${userData.role.toLowerCase()}_${Date.now()}`
      }
    })
    console.log(`✅ Created user: ${user.email} (${user.role})`)
  }

  // Create demo candidates
  const candidates = [
    {
      name: 'Alex Thompson',
      email: 'alex@example.com',
      phone: '+1-555-0101',
      position: 'Senior Frontend Developer',
      experience: '5+ years',
      githubUsername: 'alexthompson',
      skills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'])
    },
    {
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      phone: '+1-555-0102',
      position: 'Full Stack Engineer',
      experience: '3-4 years',
      githubUsername: 'sarahchen',
      skills: JSON.stringify(['JavaScript', 'Python', 'Django', 'PostgreSQL', 'Docker'])
    },
    {
      name: 'Michael Rodriguez',
      email: 'michael@example.com',
      phone: '+1-555-0103',
      position: 'Backend Developer',
      experience: '4-5 years',
      githubUsername: 'michaelr',
      skills: JSON.stringify(['Java', 'Spring Boot', 'Kubernetes', 'MongoDB', 'Redis'])
    },
    {
      name: 'Emily Johnson',
      email: 'emily@example.com',
      phone: '+1-555-0104',
      position: 'DevOps Engineer',
      experience: '6+ years',
      githubUsername: 'emilyjohnson',
      skills: JSON.stringify(['AWS', 'Terraform', 'Jenkins', 'Python', 'Bash'])
    },
    {
      name: 'David Kumar',
      email: 'david@example.com',
      phone: '+1-555-0105',
      position: 'Data Engineer',
      experience: '3-4 years',
      githubUsername: 'davidkumar',
      skills: JSON.stringify(['Python', 'Apache Spark', 'Kafka', 'Databricks', 'SQL'])
    },
    {
      name: 'Lisa Park',
      email: 'lisa@example.com',
      phone: '+1-555-0106',
      position: 'Frontend Developer',
      experience: '2-3 years',
      githubUsername: 'lisapark',
      skills: JSON.stringify(['React', 'Vue.js', 'CSS', 'JavaScript', 'Figma'])
    }
  ]

  for (const candidateData of candidates) {
    const candidate = await prisma.candidate.upsert({
      where: { email: candidateData.email },
      update: {},
      create: {
        ...candidateData,
        githubUrl: candidateData.githubUsername ? `https://github.com/${candidateData.githubUsername}` : null,
        status: CandidateStatus.APPLIED
      }
    })
    console.log(`✅ Created candidate: ${candidate.name} (${candidate.position})`)
  }

  // Create sample GitHub analyses
  const githubAnalyses = [
    {
      candidateEmail: 'alex@example.com',
      username: 'alexthompson',
      overallScore: 8.7,
      activityScore: 8.5,
      codeQualityScore: 9.0,
      collaborationScore: 8.5,
      consistencyScore: 8.8,
      insights: JSON.stringify([
        'Highly active developer with consistent contributions',
        'Strong expertise in React and TypeScript',
        'Good documentation practices',
        'Active in open source community'
      ])
    },
    {
      candidateEmail: 'sarah@example.com',
      username: 'sarahchen',
      overallScore: 7.8,
      activityScore: 7.5,
      codeQualityScore: 8.2,
      collaborationScore: 7.8,
      consistencyScore: 7.6,
      insights: JSON.stringify([
        'Solid full-stack development skills',
        'Good code quality with proper testing',
        'Regular contributions over the past year',
        'Experience with modern web technologies'
      ])
    },
    {
      candidateEmail: 'michael@example.com',
      username: 'michaelr',
      overallScore: 8.2,
      activityScore: 8.0,
      codeQualityScore: 8.5,
      collaborationScore: 8.0,
      consistencyScore: 8.3,
      insights: JSON.stringify([
        'Strong backend development expertise',
        'Excellent code structure and patterns',
        'Consistent contributor with good collaboration',
        'Experience with enterprise-level applications'
      ])
    }
  ]

  for (const analysisData of githubAnalyses) {
    const candidate = await prisma.candidate.findUnique({
      where: { email: analysisData.candidateEmail }
    })
    
    if (candidate) {
      const analysis = await prisma.gitHubAnalysis.create({
        data: {
          candidateId: candidate.id,
          username: analysisData.username,
          profileData: JSON.stringify({
            login: analysisData.username,
            name: candidate.name,
            public_repos: 25,
            followers: 120,
            following: 80
          }),
          repositories: JSON.stringify([
            {
              name: 'awesome-project',
              description: 'A great project showcasing skills',
              language: 'TypeScript',
              stargazers_count: 45,
              forks_count: 8
            }
          ]),
          contributions: JSON.stringify({
            commitsLastYear: 250,
            activeDays: 180,
            averageCommitsPerDay: 1.4
          }),
          languageStats: JSON.stringify({
            'TypeScript': 35000,
            'JavaScript': 28000,
            'Python': 15000,
            'CSS': 8000
          }),
          activityScore: analysisData.activityScore,
          codeQualityScore: analysisData.codeQualityScore,
          collaborationScore: analysisData.collaborationScore,
          consistencyScore: analysisData.consistencyScore,
          overallScore: analysisData.overallScore,
          insights: analysisData.insights
        }
      })
      console.log(`✅ Created GitHub analysis for: ${candidate.name}`)
    }
  }

  // Create sample interviews
  const recruiterUser = await prisma.user.findUnique({ where: { email: 'recruiter@devmeet.ai' } })
  const interviewerUser = await prisma.user.findUnique({ where: { email: 'interviewer@devmeet.ai' } })
  
  if (recruiterUser && interviewerUser) {
    const sampleCandidates = await prisma.candidate.findMany({ take: 3 })
    
    for (const candidate of sampleCandidates) {
      const interview = await prisma.interview.create({
        data: {
          title: `${candidate.position} Technical Interview`,
          description: `Technical assessment for ${candidate.name}`,
          candidateId: candidate.id,
          interviewerId: interviewerUser.id,
          type: InterviewType.TECHNICAL,
          status: Math.random() > 0.5 ? InterviewStatus.COMPLETED : InterviewStatus.SCHEDULED,
          scheduledAt: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in next 7 days
          aiPersonality: 'professional',
          techStack: candidate.skills,
          difficultyLevel: 'intermediate',
          questions: JSON.stringify({
            questions: [
              {
                id: 'q1',
                question: 'Explain the difference between let, const, and var in JavaScript.',
                type: 'technical',
                difficulty: 'medium'
              }
            ],
            responses: [],
            currentIndex: 0
          }),
          score: Math.random() * 3 + 7, // Random score between 7-10
          completedAt: Math.random() > 0.5 ? new Date() : null
        }
      })
      
      // Create assessment if interview is completed
      if (interview.status === InterviewStatus.COMPLETED) {
        await prisma.assessment.create({
          data: {
            interviewId: interview.id,
            candidateId: candidate.id,
            assessorId: interviewerUser.id,
            technicalScore: interview.score!,
            communicationScore: interview.score! * 0.9,
            problemSolvingScore: interview.score! * 1.1,
            cultureScore: interview.score! * 0.8,
            overallScore: interview.score!,
            feedback: `Strong technical skills demonstrated. ${candidate.name} showed excellent problem-solving abilities and clear communication.`,
            recommendation: interview.score! >= 8 ? 'HIRE' : 'NO_HIRE',
            strengths: JSON.stringify([
              'Strong technical foundation',
              'Clear communication',
              'Good problem-solving approach'
            ]),
            weaknesses: JSON.stringify([
              'Could improve system design knowledge',
              'More experience with testing would be beneficial'
            ])
          }
        })
      }
      
      console.log(`✅ Created interview for: ${candidate.name}`)
    }
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })