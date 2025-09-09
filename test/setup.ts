// @ts-nocheck
import '@testing-library/jest-native/extend-expect'
import { jest } from '@jest/globals'

// Mock Expo modules
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: ({ children }: { children: React.ReactNode }) => children,
  Tabs: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}))

jest.mock('expo-constants', () => ({
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
jest.mock('lucide-react-native', () => {
  const MockIcon = ({ color, size, ...props }) => {
  }
  const { Text } = require('react-native')
  
  return new Proxy({}, {
    get: (target, prop) => {
      return React.forwardRef((props: any, ref: any) => 
        React.createElement(Text, { ...props, ref }, prop.toString())
      )
    }
  })
})

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}))

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}))

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}