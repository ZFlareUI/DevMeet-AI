import NextAuth, { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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

        try {
          console.log('Attempting to authenticate user:', credentials.email)
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            console.log('No user found with email:', credentials.email)
            return null
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

          console.log('User authenticated successfully:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user, account }: any) => {
      if (user) {
        token.role = user.role || UserRole.CANDIDATE
        token.id = user.id
      }

      // Handle GitHub OAuth users
      if (account?.provider === 'github' && user?.email) {
        try {
          // Check if user exists in database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!dbUser) {
            // Create new user from GitHub profile
            dbUser = await prisma.user.create({
              data: {
                id: `github_${user.id}`,
                email: user.email,
                name: user.name || 'GitHub User',
                image: user.image,
                role: UserRole.CANDIDATE,
                emailVerified: new Date()
              }
            })
          }

          token.role = dbUser.role
          token.id = dbUser.id
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