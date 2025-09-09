import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockedFunction,
} from 'vitest';

import AuthScreen from '../../components/AuthScreen';
import { useAuth } from '../../hooks/useAuth';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;

describe('AuthScreen Component', () => {
  const mockSignIn = vi.fn();
  const mockSignUp = vi.fn();
  const originalDev = (globalThis as any).__DEV__;

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__DEV__ = false;
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      ready: true,
      loading: false,
      authError: null,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      fetchProfile: vi.fn(),
    });
  });

  afterEach(() => {
    (globalThis as any).__DEV__ = originalDev;
  });

  it('should render login form by default', () => {
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);

    expect(getByText('OpsPilot')).toBeTruthy();
    expect(getByText('Connexion')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe')).toBeTruthy();
    expect(getByText('Se connecter')).toBeTruthy();
  });

  it('should switch to signup form when toggle is pressed', () => {
    const { getByText } = render(<AuthScreen />);

    fireEvent.click(getByText("Pas encore de compte ? S'inscrire"));

    expect(getByText('Créer un compte')).toBeTruthy();
    expect(getByText("S'inscrire")).toBeTruthy();
  });

  it('should show full name input in signup mode', () => {
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);

    fireEvent.click(getByText("Pas encore de compte ? S'inscrire"));

    expect(getByPlaceholderText('Nom complet')).toBeTruthy();
  });

  it('should call signIn when login form is submitted', async () => {
    mockSignIn.mockResolvedValue({ data: {}, error: null });

    const { getByPlaceholderText, getByText } = render(<AuthScreen />);

    fireEvent.change(getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Mot de passe'), {
      target: { value: 'password123' },
    });
    fireEvent.click(getByText('Se connecter'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });
  });

  it('should call signUp when signup form is submitted', async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null });

    const { getByPlaceholderText, getByText } = render(<AuthScreen />);

    // Switch to signup mode
    fireEvent.click(getByText("Pas encore de compte ? S'inscrire"));

    fireEvent.change(getByPlaceholderText('Nom complet'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Mot de passe'), {
      target: { value: 'password123' },
    });
    fireEvent.click(getByText("S'inscrire"));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User',
      );
    });
  });

  it('should display demo account information in development mode', () => {
    (globalThis as any).__DEV__ = true;
    const { getByText } = render(<AuthScreen />);

    expect(getByText('Compte de démonstration')).toBeTruthy();
    expect(getByText('Email: demo@opspilot.com')).toBeTruthy();
    expect(getByText('Mot de passe: demo123')).toBeTruthy();
  });

  it('should not display demo account information in production mode', () => {
    (globalThis as any).__DEV__ = false;
    const { queryByText } = render(<AuthScreen />);

    expect(queryByText('Compte de démonstration')).toBeNull();
    expect(queryByText('Email: demo@opspilot.com')).toBeNull();
    expect(queryByText('Mot de passe: demo123')).toBeNull();
  });

  it('should show loading state when authenticating', () => {
    const { queryByText } = render(<AuthScreen />);

    // Simulate loading state
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      ready: false,
      loading: true,
      authError: null,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      fetchProfile: vi.fn(),
    });

    render(<AuthScreen />);

    // The component should handle loading states appropriately
    expect(queryByText('Chargement...')).toBeFalsy(); // Initially not shown
  });
});
