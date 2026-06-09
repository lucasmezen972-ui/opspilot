import { render } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, type MockedFunction } from 'vitest';

import RootLayout from '../../app/_layout';
import { useAuth } from '../../hooks/AuthContext';

vi.mock('../../hooks/AuthContext', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    useAuth: vi.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock('@/hooks/useFrameworkReady', () => ({
  useFrameworkReady: vi.fn(),
}));

const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;

describe('Authentication Flow Integration', () => {
  it('should show AuthScreen when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      ready: true,
      loading: false,
      authError: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      fetchProfile: vi.fn(),
    });

    const { getByText } = render(<RootLayout />);

    expect(getByText('OpsPilot')).toBeTruthy();
    expect(getByText('Connexion')).toBeTruthy();
  });

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
      ready: true,
      loading: false,
      authError: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      fetchProfile: vi.fn(),
    });

    const { queryByText } = render(<RootLayout />);

    expect(queryByText('Connexion')).toBeFalsy();
  });

  it('should show loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      ready: false,
      loading: true,
      authError: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      fetchProfile: vi.fn(),
    });

    const { container } = render(<RootLayout />);

    expect(container.firstChild).not.toBeNull();
  });
});
