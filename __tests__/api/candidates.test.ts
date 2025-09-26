import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/candidates/route'

// Mock Prisma with jest functions
const mockFindMany = jest.fn()
const mockCreate = jest.fn()
const mockCount = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    candidate: {
      findMany: mockFindMany,
      create: mockCreate,
      count: mockCount,
    },
  },
}))

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: { id: '1', role: 'ADMIN', email: 'admin@test.com' },
    })
  ),
}))



describe('/api/candidates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/candidates', () => {
    it('should return candidates for authenticated admin user', async () => {
      const mockCandidates = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          position: 'Developer',
          status: 'ACTIVE',
          skills: ['JavaScript', 'React'],
          experience: 3,
          education: 'Computer Science',
          githubUsername: 'johndoe',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(mockCandidates)
      mockCount.mockResolvedValue(1)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/candidates',
      })

      const request = new NextRequest(req.url!, {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.candidates).toHaveLength(1)
      expect(data.candidates[0].name).toBe('John Doe')
      expect(data.total).toBe(1)
    })

    it('should handle search query parameters', async () => {
      mockFindMany.mockResolvedValue([])
      mockCount.mockResolvedValue(0)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/candidates?search=developer',
      })

      const request = new NextRequest(req.url!, {
        method: 'GET',
      })

      await GET(request)

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'developer' }) }),
              expect.objectContaining({ email: expect.objectContaining({ contains: 'developer' }) }),
              expect.objectContaining({ position: expect.objectContaining({ contains: 'developer' }) }),
            ]),
          }),
        })
      )
    })

    it('should handle pagination parameters', async () => {
      mockFindMany.mockResolvedValue([])
      mockCount.mockResolvedValue(0)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/candidates?page=2&limit=5',
      })

      const request = new NextRequest(req.url!, {
        method: 'GET',
      })

      await GET(request)

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
          take: 5,
        })
      )
    })
  })

  describe('POST /api/candidates', () => {
    it('should create a new candidate with valid data', async () => {
      const candidateData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        position: 'Frontend Developer',
        skills: ['React', 'TypeScript'],
        experience: 2,
        education: 'Computer Science',
        githubUsername: 'janesmith',
      }

      const mockCreatedCandidate = {
        id: '2',
        ...candidateData,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCreate.mockResolvedValue(mockCreatedCandidate)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/candidates',
        body: candidateData,
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify(candidateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe(candidateData.name)
      expect(data.email).toBe(candidateData.email)
      expect(mockCreate).toHaveBeenCalledWith({
        data: candidateData,
      })
    })

    it('should return 400 for invalid candidate data', async () => {
      const invalidData = {
        name: '', // Missing required name
        email: 'invalid-email', // Invalid email format
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/candidates',
        body: invalidData,
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle database errors gracefully', async () => {
      const candidateData = {
        name: 'Test User',
        email: 'test@example.com',
        position: 'Developer',
        skills: ['JavaScript'],
        experience: 1,
        education: 'CS',
      }

      mockCreate.mockRejectedValue(new Error('Database error'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/candidates',
        body: candidateData,
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify(candidateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
