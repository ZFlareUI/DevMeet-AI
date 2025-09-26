import NextAuth, { NextAuthOptions, DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { randomBytes, createHash } from 'crypto'

// Extend the default session type
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
      company?: string
      position?: string
    } & DefaultSession['user']
  }
  
  interface User {
    role: UserRole
    company?: string
    position?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    company?: string
    position?: string
  }
}

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; resetTime: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(email)
  
  if (!attempts || now > attempts.resetTime) {
    loginAttempts.set(email, { count: 1, resetTime: now + LOCKOUT_TIME })
    return true
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false
  }
  
  attempts.count++
  return true
}

function clearRateLimit(email: string) {
  loginAttempts.delete(email)
}

// Session security
function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    // Only include GitHub provider if credentials are properly configured
    ...(process.env.GITHUB_CLIENT_ID && 
        process.env.GITHUB_CLIENT_SECRET && 
        process.env.GITHUB_CLIENT_ID !== 'your-github-client-id' && 
        process.env.GITHUB_CLIENT_SECRET !== 'your-github-client-secret'
      ? [GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          profile(profile) {
            return {
              id: profile.id.toString(),
              name: profile.name || profile.login,
              email: profile.email,
              image: profile.avatar_url,
              role: UserRole.CANDIDATE, // Default role for GitHub users
              organizationId: '', // This will be set in the JWT callback when user is created
            }
          },
        })]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password')
          return null
        }

        // Check rate limiting
        if (!checkRateLimit(credentials.email)) {
          console.log('Rate limit exceeded for:', credentials.email)
          throw new Error('Too many login attempts. Please try again later.')
        }

        try {
          console.log('Attempting to authenticate user:', credentials.email)
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            console.log('No user found with email:', credentials.email)
            return null
          }

          // Check for active account
          if (!user.isActive) {
            console.log('Account is deactivated:', credentials.email)
            throw new Error('Account is deactivated. Please contact support.')
          }

          // For demo users, check if password matches role
          const demoPasswords: Record<string, string> = {
            'admin@devmeet.ai': 'admin123',
            'recruiter@devmeet.ai': 'recruiter123',
            'interviewer@devmeet.ai': 'interviewer123',
            'candidate@devmeet.ai': 'candidate123'
          }

          const expectedPassword = demoPasswords[credentials.email]
          if (expectedPassword) {
            if (credentials.password !== expectedPassword) {
              console.log('Invalid demo password for:', credentials.email)
              return null
            }
          } else {
            // For real users, check hashed password
            const userWithPassword = user as typeof user & { password?: string }
            if (!userWithPassword.password) {
              console.log('No password set for user:', credentials.email)
              return null
            }

            const isPasswordValid = await bcrypt.compare(credentials.password, userWithPassword.password)
            if (!isPasswordValid) {
              console.log('Invalid password for user:', credentials.email)
              return null
            }
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })

          // Clear rate limiting on successful login
          clearRateLimit(credentials.email)

          console.log('User authenticated successfully:', user.email)
          return {
            id: user.id,
            email: user.email!,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            company: user.company || undefined,
            position: user.position || undefined,
            image: user.image
          }
        } catch (error) {
          console.error('Authentication error:', error)
          if (error instanceof Error) {
            throw error
          }
          return null
        }
      },
    }),
  ],
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user, account }: any) => {
      if (user) {
        token.role = user.role || UserRole.CANDIDATE
        token.id = user.id
        token.organizationId = user.organizationId
        token.company = user.company
        token.position = user.position
      }

      // Handle GitHub OAuth users
      if (account?.provider === 'github' && user?.email) {
        try {
          // Check if user exists in database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!dbUser) {
            // Create organization for new GitHub user
            const organization = await prisma.organization.create({
              data: {
                name: `${user.name || 'GitHub User'}'s Organization`,
                slug: `github-${user.id}-${Date.now()}`,
              }
            })

            // Create new user from GitHub profile
            dbUser = await prisma.user.create({
              data: {
                id: `github_${user.id}`,
                email: user.email,
                name: user.name || 'GitHub User',
                image: user.image,
                role: UserRole.CANDIDATE,
                organizationId: organization.id,
                emailVerified: new Date()
              }
            })
          }

          token.role = dbUser.role
          token.id = dbUser.id
          token.organizationId = dbUser.organizationId
          token.company = dbUser.company
          token.position = dbUser.position
        } catch (error) {
          console.error('Error handling GitHub user:', error)
        }
      }

      return token
    },
    session: async ({ session, token }: any) => {
      if (token && session.user) {
        session.user.id = token.id || token.sub!
        session.user.role = token.role as UserRole
        session.user.organizationId = token.organizationId as string
        session.user.company = token.company
        session.user.position = token.position
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to appropriate dashboard based on user role
      if (url.startsWith(baseUrl)) {
        return url
      }
      return baseUrl + '/dashboard'
    }
  },
  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in via ${account?.provider || 'credentials'}`)
      
      // Log security event
      try {
        await prisma.user.update({
          where: { email: user.email! },
          data: { lastLoginAt: new Date() }
        })
      } catch (error) {
        console.error('Failed to update last login:', error)
      }
    },
    async signOut({ session }) {
      console.log(`User ${session?.user?.email} signed out`)
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)