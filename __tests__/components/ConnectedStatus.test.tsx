import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, it, expect, afterEach } from 'vitest';
import ConnectedStatus from '../../components/ConnectedStatus';

describe('ConnectedStatus Component', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  });

  it('shows connected state when configuration is valid', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const { getByText } = render(<ConnectedStatus />);
    expect(getByText('✅ Supabase connecté')).toBeTruthy();
  });

  it('shows missing config message when url is absent', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    const { getByText } = render(<ConnectedStatus />);
    expect(getByText('❌ URL Supabase manquante')).toBeTruthy();
  });

  it('shows placeholder config message when url is placeholder', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
    const { getByText } = render(<ConnectedStatus />);
    expect(getByText('❌ URL Supabase invalide')).toBeTruthy();
  });

  it('shows data count when provided', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const { getByText } = render(<ConnectedStatus dataCount={42} />);
    expect(getByText('✅ Supabase connecté • 42 enregistrements')).toBeTruthy();
  });
});
