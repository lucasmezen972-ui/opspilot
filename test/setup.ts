// @ts-nocheck
import React from 'react';
// Provide a global jest variable for test files
import { vi as jest } from 'vitest';
(globalThis as any).jest = jest;

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
  useSegments: () => [],
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement('a', { ...props, href }, children),
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    {
      Screen: ({ children }: { children: React.ReactNode }) => children,
    },
  ),
  Tabs: ({ children }: { children: React.ReactNode }) => children,
  Slot: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement('div', props, children),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
      },
    },
  },
}));

// Mock Lucide React Native icons
jest.mock('lucide-react-native', () => {
  return new Proxy(
    {},
    {
      get: (_target, prop) =>
        React.forwardRef((props: any, ref: any) =>
          React.createElement('span', { ...props, ref }, prop.toString()),
        ),
      has: () => true,
    },
  );
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

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
}));
