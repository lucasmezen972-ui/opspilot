import { describe, it, expect, afterEach } from 'vitest';
import { getSupabaseConfigStatus, isSupabaseConfigured } from '../../utils/supabaseConfig';

describe('supabaseConfig utility', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  });

  it('detects missing url', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    expect(getSupabaseConfigStatus()).toEqual({ status: 'missing' });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('detects placeholder url', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
    expect(getSupabaseConfigStatus()).toEqual({ status: 'placeholder' });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('detects valid url', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    expect(getSupabaseConfigStatus()).toEqual({ status: 'valid', url: 'https://example.supabase.co' });
    expect(isSupabaseConfigured()).toBe(true);
  });
});
