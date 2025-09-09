import { render } from '@testing-library/react';
import React from 'react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';

import ManagerDashboard from '../../app/(tabs)/manager';
import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import { useTasks } from '../../hooks/useTasks';

vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useAudits');
vi.mock('../../hooks/useTasks');

const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;
const mockUseAudits = useAudits as MockedFunction<typeof useAudits>;
const mockUseTasks = useTasks as MockedFunction<typeof useTasks>;

describe('ManagerDashboard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'manager-1' } as any,
      profile: { full_name: 'Marie Dupont', role: 'manager' } as any,
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

    mockUseAudits.mockReturnValue({
      audits: [
        { id: '1', status: 'pending' as const },
        { id: '2', status: 'completed' as const },
      ] as any,
      loading: false,
      createAudit: vi.fn(),
      updateAuditStatus: vi.fn(),
      addPhotoToAudit: vi.fn(),
      refetch: vi.fn(),
    });

    mockUseTasks.mockReturnValue({
      tasks: [
        { id: '1', status: 'pending' as const },
        { id: '2', status: 'completed' as const },
      ] as any,
      loading: false,
      createTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      getMyTasks: vi.fn(),
      getTasksByStatus: vi.fn(),
      getTasksByPriority: vi.fn(),
      refetch: vi.fn(),
    });
  });

  it('renders manager stats', () => {
    const { getByText, getAllByText } = render(<ManagerDashboard />);

    expect(getByText('Dashboard Manager')).toBeTruthy();
    expect(getByText('Audits en cours')).toBeTruthy();
    expect(getByText('Tâches en attente')).toBeTruthy();
    expect(getAllByText('1')).toHaveLength(2);
  });
});
