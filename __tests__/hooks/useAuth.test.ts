import { renderHook, act } from '@testing-library/react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

// Mock Supabase response
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
}

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.session).toBe(null)
  })

  it('should sign in successfully', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { 
        user: mockSession.user, 
        session: mockSession as any 
      },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password123')
      expect(response.error).toBe(null)
      expect(response.data).toBeDefined()
    })

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('should sign up successfully', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { 
        user: mockSession.user, 
        session: mockSession as any 
      },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const response = await result.current.signUp('test@example.com', 'password123', 'Test User')
      expect(response.error).toBe(null)
    })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User',
        },
      },
    })
  })

  it('should sign out successfully', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const response = await result.current.signOut()
      expect(response.error).toBe(null)
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('should handle sign in error', async () => {
    const mockError = new Error('Invalid credentials')
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError as any,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const response = await result.current.signIn('invalid@example.com', 'wrongpassword')
      expect(response.error).toBe(mockError)
    })
  })
})