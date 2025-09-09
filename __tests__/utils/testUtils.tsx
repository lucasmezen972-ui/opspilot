import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react-native'

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react-native'
export { customRender as render }

// Common test data
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

export const mockProfile = {
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
}

export const mockAudit = {
  id: 'audit-1',
  organization_id: 'org-1',
  store_id: 'store-1',
  template_id: null,
  auditor_id: 'user-1',
  title: 'Test Audit',
  description: 'Test audit description',
  location: 'Test location',
  status: 'pending' as const,
  score: null,
  max_score: 100,
  issues_count: 0,
  photos: [],
  notes: null,
  started_at: null,
  completed_at: null,
  due_date: '2024-01-20T10:00:00Z',
  created_at: '2024-01-15T08:00:00Z',
  updated_at: '2024-01-15T08:00:00Z',
}

export const mockTask = {
  id: 'task-1',
  organization_id: 'org-1',
  store_id: 'store-1',
  assigned_to: 'user-1',
  created_by: 'user-2',
  title: 'Test Task',
  description: 'Test task description',
  location: 'Test location',
  priority: 'medium' as const,
  status: 'pending' as const,
  estimated_time_minutes: 30,
  due_date: '2024-01-15T14:00:00Z',
  completed_at: null,
  created_at: '2024-01-15T08:00:00Z',
  updated_at: '2024-01-15T08:00:00Z',
}

// Helper functions
export const createMockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
})

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))