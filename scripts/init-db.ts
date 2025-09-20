import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create demo users if they don't exist
  const demoUsers = [
    {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@devmeet.ai',
      role: UserRole.ADMIN,
      company: 'DevMeet AI',
      position: 'System Administrator'
    },
    {
      id: 'recruiter-1',
      name: 'Sarah Johnson',
      email: 'recruiter@devmeet.ai',
      role: UserRole.RECRUITER,
      company: 'TechCorp',
      position: 'Senior Recruiter'
    },
    {
      id: 'interviewer-1',
      name: 'Mike Chen',
      email: 'interviewer@devmeet.ai',
      role: UserRole.INTERVIEWER,
      company: 'TechCorp',
      position: 'Senior Engineer'
    },
    {
      id: 'candidate-1',
      name: 'Alex Smith',
      email: 'candidate@devmeet.ai',
      role: UserRole.CANDIDATE,
      position: 'Full Stack Developer'
    }
  ]

  for (const userData of demoUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (!existingUser) {
      await prisma.user.create({
        data: {
          ...userData,
          emailVerified: new Date()
        }
      })
      console.log(`Created demo user: ${userData.email}`)
    } else {
      console.log(`Demo user already exists: ${userData.email}`)
    }
  }

  console.log('Database initialization completed!')
}

main()
  .catch((e) => {
    console.error('Error initializing database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })