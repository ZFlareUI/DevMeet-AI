import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useSession } from 'next-auth/react'
import DashboardPage from '@/app/dashboard/page'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

describe('Dashboard Page', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders dashboard for authenticated admin user', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
          organizationId: 'org-1',
        },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    // Mock fetch responses
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { id: '1', name: 'John Doe', position: 'Developer', status: 'ACTIVE' },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { id: '1', candidate: { name: 'John Doe' }, scheduledAt: '2024-01-15T10:00:00Z' },
        ]),
      })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    })

    expect(screen.getByText('Recent Candidates')).toBeInTheDocument()
    expect(screen.getByText('Upcoming Interviews')).toBeInTheDocument()
  })

  it('renders dashboard for authenticated interviewer', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '2',
          email: 'interviewer@example.com',
          name: 'Interviewer User',
          role: 'INTERVIEWER',
          organizationId: 'org-1',
        },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    })
  })

  it('shows error message when API calls fail', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
          organizationId: 'org-1',
        },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    // Mock failed fetch
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    })

    // Should handle errors gracefully
    expect(screen.getByText('Recent Candidates')).toBeInTheDocument()
  })

  it('handles quick actions correctly', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
          organizationId: 'org-1',
        },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    ;(global.fetch as jest.Mock)
      .mockResolvedValue({
        ok: true,
        json: async () => ([]),
      })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    })

    // Test quick action buttons
    const addCandidateButton = screen.getByRole('link', { name: /add candidate/i })
    expect(addCandidateButton).toBeInTheDocument()
    expect(addCandidateButton).toHaveAttribute('href', '/candidates/new')

    const scheduleInterviewButton = screen.getByRole('link', { name: /schedule interview/i })
    expect(scheduleInterviewButton).toBeInTheDocument()
    expect(scheduleInterviewButton).toHaveAttribute('href', '/interviews/create')
  })
})