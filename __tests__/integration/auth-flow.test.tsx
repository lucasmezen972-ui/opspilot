import React from 'react'
import { render } from '@testing-library/react'
import RootLayout from '../../app/_layout'
import { useAuth } from '../../hooks/useAuth'

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock useFrameworkReady
vi.mock('@/hooks/useFrameworkReady', () => ({
  useFrameworkReady: vi.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('Authentication Flow Integration', () => {
  it('should show AuthScreen when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refetchProfile: vi.fn(),
    })

    const { getByText } = render(<RootLayout />)
    
    expect(getByText('OpsPilot')).toBeTruthy()
    expect(getByText('Connexion')).toBeTruthy()
  })

  it('should show main app when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' } as any,
      profile: {
        id: 'user-1',
        organization_id: 'org-1',
        store_id: 'store-1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'employee' as const,
        level: 1,
        xp: 100,
        total_audits: 0,
        avg_score: 0,
        completed_trainings: 0,
        active_time_hours: 0,
        last_active: '2024-01-15T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      session: { user: { id: 'user-1' } } as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refetchProfile: vi.fn(),
    })

    const { queryByText } = render(<RootLayout />)
    
    // Should not show auth screen
    expect(queryByText('Connexion')).toBeFalsy()
  })

  it('should show loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refetchProfile: vi.fn(),
    })

    const { container } = render(<RootLayout />)

    // Should not render anything while loading
    expect(container.firstChild).toBeNull()
  })
})