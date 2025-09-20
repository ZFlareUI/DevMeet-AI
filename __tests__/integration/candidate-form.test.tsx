import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from 'next-auth/react'
import CandidateForm from '@/app/candidates/new/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  redirect: jest.fn(),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

const MockedSessionProvider = ({ children, session }: any) => {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}

describe('Candidate Form Integration', () => {
  const mockSession = {
    user: {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
    expires: '2024-12-31',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should submit candidate form with valid data', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        position: 'Frontend Developer',
      }),
    })

    render(
      <MockedSessionProvider session={mockSession}>
        <CandidateForm />
      </MockedSessionProvider>
    )

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })

    // Fill out the form
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/position/i), 'Frontend Developer')
    await user.type(screen.getByLabelText(/experience/i), '3')
    await user.type(screen.getByLabelText(/education/i), 'Computer Science')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /add candidate/i })
    await user.click(submitButton)

    // Verify API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          position: 'Frontend Developer',
          experience: 3,
          education: 'Computer Science',
          skills: [],
        }),
      })
    })
  })

  it('should show validation errors for invalid form data', async () => {
    const user = userEvent.setup()

    render(
      <MockedSessionProvider session={mockSession}>
        <CandidateForm />
      </MockedSessionProvider>
    )

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /add candidate/i })
    await user.click(submitButton)

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/position is required/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()

    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    render(
      <MockedSessionProvider session={mockSession}>
        <CandidateForm />
      </MockedSessionProvider>
    )

    // Fill out the form
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/position/i), 'Frontend Developer')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /add candidate/i })
    await user.click(submitButton)

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to add candidate/i)).toBeInTheDocument()
    })
  })

  it('should add and remove skills dynamically', async () => {
    const user = userEvent.setup()

    render(
      <MockedSessionProvider session={mockSession}>
        <CandidateForm />
      </MockedSessionProvider>
    )

    // Add a skill
    const skillInput = screen.getByLabelText(/add skill/i)
    await user.type(skillInput, 'React')
    await user.keyboard('{Enter}')

    // Verify skill was added
    expect(screen.getByText('React')).toBeInTheDocument()

    // Add another skill
    await user.type(skillInput, 'TypeScript')
    await user.keyboard('{Enter}')

    // Verify both skills are present
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()

    // Remove a skill
    const removeReactButton = screen.getByRole('button', { name: /remove react/i })
    await user.click(removeReactButton)

    // Verify skill was removed
    expect(screen.queryByText('React')).not.toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'John Doe' }),
    })

    render(
      <MockedSessionProvider session={mockSession}>
        <CandidateForm />
      </MockedSessionProvider>
    )

    // Fill and submit form
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/position/i), 'Developer')

    const submitButton = screen.getByRole('button', { name: /add candidate/i })
    await user.click(submitButton)

    // Wait for success and form reset
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('')
      expect(screen.getByLabelText(/email/i)).toHaveValue('')
      expect(screen.getByLabelText(/position/i)).toHaveValue('')
    })
  })
})