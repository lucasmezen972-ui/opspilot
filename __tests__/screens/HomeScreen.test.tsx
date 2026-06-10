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

import HomeScreen from '../../app/(tabs)/index';
import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import { useProducts } from '../../hooks/useProducts';

vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useAudits');
vi.mock('../../hooks/useCorrectiveActions');
vi.mock('../../hooks/useProducts');

const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;
const mockUseAudits = useAudits as MockedFunction<typeof useAudits>;
const mockUseCorrectiveActions = useCorrectiveActions as MockedFunction<typeof useCorrectiveActions>;
const mockUseProducts = useProducts as MockedFunction<typeof useProducts>;

const mockProfile = {
  id: 'user-1',
  organization_id: 'org-1',
  store_id: 'store-1',
  email: 'marie@example.com',
  full_name: 'Marie Dupont',
  role: 'manager' as const,
  level: 4,
  xp: 850,
  total_audits: 47,
  avg_score: 92,
  completed_trainings: 12,
  active_time_hours: 156,
  last_active: '2024-01-15T10:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const mockAudit = {
  id: 'audit-1',
  organization_id: 'org-1',
  store_id: 'store-1',
  template_id: null,
  auditor_id: 'user-1',
  title: 'Contrôle rayon frais',
  description: 'Audit quotidien',
  location: 'Rayon frais',
  status: 'completed' as const,
  score: 95,
  max_score: 100,
  issues_count: 1,
  photos: [],
  notes: null,
  started_at: '2024-01-15T09:00:00Z',
  completed_at: '2024-01-15T09:30:00Z',
  due_date: '2024-01-15T10:00:00Z',
  created_at: '2024-01-15T08:00:00Z',
  updated_at: '2024-01-15T09:30:00Z',
};

describe('HomeScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' } as any,
      profile: mockProfile,
      session: null,
      ready: true,
      loading: false,
      authError: null,
      isOffline: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      fetchProfile: vi.fn(),
    });

    mockUseAudits.mockReturnValue({
      audits: [mockAudit],
      loading: false,
      createAudit: vi.fn(),
      updateAuditStatus: vi.fn(),
      addPhotoToAudit: vi.fn(),
      refetch: vi.fn(),
    });

    mockUseCorrectiveActions.mockReturnValue({
      actions: [],
      loading: false,
      createAction: vi.fn(),
      updateActionStatus: vi.fn(),
      isOverdue: vi.fn(),
      getActionsByStatus: vi.fn(),
      refetch: vi.fn(),
    });

    mockUseProducts.mockReturnValue({
      products: [],
      loading: false,
      scanProduct: vi.fn(),
      updateProductStock: vi.fn(),
      createProduct: vi.fn(),
      refetch: vi.fn(),
    } as any);
  });

  it('should render welcome message with user name', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Bonjour, Marie !')).toBeTruthy();
  });

  it('should display KPI section', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('KPIs du jour')).toBeTruthy();
    expect(getByText('Audits réalisés')).toBeTruthy();
    expect(getByText('Audits en retard')).toBeTruthy();
    expect(getByText('Actions ouvertes')).toBeTruthy();
  });

  it('should show quick access section', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Accès rapide')).toBeTruthy();
    expect(getByText('Audits')).toBeTruthy();
  });

  it('should display recent audits', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Audits récents')).toBeTruthy();
    expect(getByText('Contrôle rayon frais')).toBeTruthy();
  });

  it('should show gamification panel', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Votre progression')).toBeTruthy();
    expect(getByText('Niv. 4')).toBeTruthy();
  });

  it('should show manager shortcuts for manager role', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Gestion équipe')).toBeTruthy();
    expect(getByText('Équipe')).toBeTruthy();
  });

  it('should handle empty audits with empty state', () => {
    mockUseAudits.mockReturnValue({
      audits: [],
      loading: false,
      createAudit: vi.fn(),
      updateAuditStatus: vi.fn(),
      addPhotoToAudit: vi.fn(),
      refetch: vi.fn(),
    });

    const { getByText } = render(<HomeScreen />);
    expect(getByText('Aucun audit récent')).toBeTruthy();
    expect(getByText('Créer un audit →')).toBeTruthy();
  });
});
