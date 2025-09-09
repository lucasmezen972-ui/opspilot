import React from 'react'
import { render } from '@testing-library/react-native'
import HomeScreen from '../../app/(tabs)/index'
import { useAuth } from '../../hooks/useAuth'
import { useAudits } from '../../hooks/useAudits'
import { useTasks } from '../../hooks/useTasks'

// Mock all hooks
jest.mock('../../hooks/useAuth')
jest.mock('../../hooks/useAudits')
jest.mock('../../hooks/useTasks')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseAudits = useAudits as jest.MockedFunction<typeof useAudits>
const mockUseTasks = useTasks as jest.MockedFunction<typeof useTasks>

describe('HomeScreen', () => {
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
  }

  const mockAudits = [
    {
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
    }
  ]

  const mockTasks = [
    {
      id: 'task-1',
      organization_id: 'org-1',
      store_id: 'store-1',
      assigned_to: 'user-1',
      created_by: 'user-2',
      title: 'Vérification DLC',
      description: 'Contrôler les dates',
      location: 'Rayon frais',
      priority: 'high' as const,
      status: 'completed' as const,
      estimated_time_minutes: 30,
      due_date: '2024-01-15T14:00:00Z',
      completed_at: '2024-01-15T13:45:00Z',
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-15T13:45:00Z',
    }
  ]

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' } as any,
      profile: mockProfile,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
      refetchProfile: jest.fn(),
    })

    mockUseAudits.mockReturnValue({
      audits: mockAudits,
      loading: false,
      createAudit: jest.fn(),
      updateAuditStatus: jest.fn(),
      addPhotoToAudit: jest.fn(),
      refetch: jest.fn(),
    })

    mockUseTasks.mockReturnValue({
      tasks: mockTasks,
      loading: false,
      createTask: jest.fn(),
      updateTaskStatus: jest.fn(),
      getMyTasks: jest.fn().mockReturnValue(mockTasks),
      getTasksByStatus: jest.fn(),
      getTasksByPriority: jest.fn(),
      refetch: jest.fn(),
    })
  })

  it('should render welcome message with user name', () => {
    const { getByText } = render(<HomeScreen />)
    
    expect(getByText('Bonjour, Marie !')).toBeTruthy()
    expect(getByText('Prêt pour une journée productive ?')).toBeTruthy()
  })

  it('should display user stats correctly', () => {
    const { getByText } = render(<HomeScreen />)
    
    expect(getByText('92%')).toBeTruthy() // avg_score
    expect(getByText('Score du jour')).toBeTruthy()
  })

  it('should show quick actions section', () => {
    const { getByText } = render(<HomeScreen />)
    
    expect(getByText('Actions rapides')).toBeTruthy()
    expect(getByText('Nouvel audit')).toBeTruthy()
    expect(getByText('Scanner produit')).toBeTruthy()
    expect(getByText('Mes badges')).toBeTruthy()
    expect(getByText('Mes tâches')).toBeTruthy()
  })

  it('should display recent activities', () => {
    const { getByText } = render(<HomeScreen />)
    
    expect(getByText('Activités récentes')).toBeTruthy()
    expect(getByText('Contrôle rayon frais')).toBeTruthy()
  })

  it('should show gamification panel', () => {
    const { getByText } = render(<HomeScreen />)
    
    expect(getByText('Votre progression')).toBeTruthy()
    expect(getByText('Expert Magasin')).toBeTruthy()
    expect(getByText('Niveau 4 • 850/1000 XP')).toBeTruthy()
  })

  it('should display summary section', () => {
    const { getByText } = render(<HomeScreen />)
    
    expect(getByText('Résumé du jour')).toBeTruthy()
    expect(getByText('Audits')).toBeTruthy()
    expect(getByText('Tâches')).toBeTruthy()
    expect(getByText('Formations')).toBeTruthy()
  })

  it('should show user position section', () => {
    const { getByText } = render(<HomeScreen />)
    
    expect(getByText('Votre position')).toBeTruthy()
    expect(getByText('Marie Dupont')).toBeTruthy()
    expect(getByText('850 XP • Niveau 4')).toBeTruthy()
  })

  it('should handle empty states when no data', () => {
    mockUseAudits.mockReturnValue({
      audits: [],
      loading: false,
      createAudit: jest.fn(),
      updateAuditStatus: jest.fn(),
      addPhotoToAudit: jest.fn(),
      refetch: jest.fn(),
    })

    mockUseTasks.mockReturnValue({
      tasks: [],
      loading: false,
      createTask: jest.fn(),
      updateTaskStatus: jest.fn(),
      getMyTasks: jest.fn().mockReturnValue([]),
      getTasksByStatus: jest.fn(),
      getTasksByPriority: jest.fn(),
      refetch: jest.fn(),
    })

    const { getByText } = render(<HomeScreen />)
    
    // Should show demo activities when no real data
    expect(getByText('Audit rayon frais terminé')).toBeTruthy()
    expect(getByText('3 produits en rupture détectés')).toBeTruthy()
  })
})