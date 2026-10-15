import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';

import ConnectedStatus from '../../components/ConnectedStatus';

describe('ConnectedStatus Component', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    vi.restoreAllMocks();
  });

  it('shows connected state when Supabase is reachable', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    const { getByText } = render(<ConnectedStatus />);
    await waitFor(() => {
      expect(getByText(/Supabase connecté/)).toBeTruthy();
    });
  });

  it('shows unreachable state when Supabase is down', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    const { getByText } = render(<ConnectedStatus />);
    await waitFor(() => {
      expect(getByText(/Supabase injoignable/)).toBeTruthy();
    });
  });

  it('shows unreachable when fallback URL is used and Supabase is down', async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    const { getByText } = render(<ConnectedStatus />);
    await waitFor(() => {
      expect(getByText(/Supabase injoignable/)).toBeTruthy();
    });
  });

  it('shows placeholder config message when url is placeholder', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
    const { getByText } = render(<ConnectedStatus />);
    expect(getByText('❌ URL Supabase invalide')).toBeTruthy();
  });

  it('shows data count when provided and reachable', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    const { getByText } = render(<ConnectedStatus dataCount={42} />);
    await waitFor(() => {
      expect(
        getByText('✅ Supabase connecté • 42 enregistrements'),
      ).toBeTruthy();
    });
  });
});
