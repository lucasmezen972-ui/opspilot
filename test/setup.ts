// @ts-nocheck
import { vi as jest } from 'vitest'
import { createRequire } from 'module'
import React from 'react'

// Ensure any import of "react-native" resolves to the web implementation before modules load
const require = createRequire(import.meta.url)
const Module = require('module')
const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function (request: string, parent, isMain, options) {
  if (request === 'react-native') {
    request = 'react-native-web/dist/cjs'
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

// Provide a global jest variable for test files
;(globalThis as any).jest = jest

// Redirect react-native imports to react-native-web for testing
jest.mock('react-native', () => require('react-native-web/dist/cjs'))

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
  return new Proxy(
    {},
    {
      get: (_target, prop) =>
        React.forwardRef((props: any, ref: any) =>
          React.createElement('span', { ...props, ref }, prop.toString())
        ),
      has: () => true,
    }
  )
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
