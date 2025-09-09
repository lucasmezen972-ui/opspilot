import '@testing-library/react-native/extend-expect'

// Mock Expo modules
vi.mock('expo-router', () => ({
  router: {
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  },
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  Stack: ({ children }: { children: React.ReactNode }) => children,
  Tabs: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}))

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
      },
    },
  },
}))

// Mock Lucide React Native icons
vi.mock('lucide-react-native', () => {
  const { View } = require('react-native')
  
  return new Proxy({}, {
    get: (target, prop) => {
      return React.forwardRef((props: any, ref: any) => 
        React.createElement(View, { ...props, ref, testID: `mock-icon-${prop.toString()}` })
      )
    }
  })
})

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

// Global test utilities
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}