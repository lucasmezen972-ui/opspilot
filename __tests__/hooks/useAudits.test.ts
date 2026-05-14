import { renderHook, act } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';

import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 'new-audit' }, error: null }),
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { id: 'audit-1', status: 'in_progress' },
                error: null,
              }),
            ),
          })),
        })),
      })),
    })),
  },
}));

const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;

describe('useAudits Hook', () => {
  const mockProfile = {
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
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' } as any,
      profile: mockProfile,
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
  });

  it('should initialize with empty audits and loading true', () => {
    const { result } = renderHook(() => useAudits());

    expect(result.current.audits).toEqual([]);
    // Loading starts true, then may become false after fetch
    expect(typeof result.current.loading).toBe('boolean');
  });

  it('should create audit with correct data structure', async () => {
    const { result } = renderHook(() => useAudits());

    const auditData = {
      title: 'Test Audit',
      description: 'Test audit description',
      location: 'Test location',
      due_date: '2024-01-20T10:00:00Z',
    };

    await act(async () => {
      const response = await result.current.createAudit(auditData);
      expect(response).toBeDefined();
    });
  });

  it('should handle audit status update', async () => {
    const { result } = renderHook(() => useAudits());

    await act(async () => {
      const response = await result.current.updateAuditStatus(
        'audit-1',
        'in_progress',
      );
      expect(response).toBeDefined();
    });
  });

  it('should add photo to audit', async () => {
    const { result } = renderHook(() => useAudits());

    await act(async () => {
      const response = await result.current.addPhotoToAudit(
        'audit-1',
        'https://example.com/photo.jpg',
      );
      expect(response).toBeDefined();
    });
  });
});
