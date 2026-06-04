import { describe, it, expect, afterEach } from 'vitest';

import {
  getSupabaseConfigStatus,
  isSupabaseConfigured,
} from '../../utils/supabaseConfig';

describe('supabaseConfig utility', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  });

  it('falls back to default URL when env var is missing', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    const result = getSupabaseConfigStatus();
    expect(result.status).toBe('valid');
    expect(result.url).toContain('supabase.co');
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('detects placeholder url', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
    expect(getSupabaseConfigStatus()).toEqual({ status: 'placeholder' });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('detects valid url', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    expect(getSupabaseConfigStatus()).toEqual({
      status: 'valid',
      url: 'https://example.supabase.co',
    });
    expect(isSupabaseConfigured()).toBe(true);
  });
});
