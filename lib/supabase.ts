import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing');

export const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let attempt = 0;
  while (true) {
    const res = await fetch(input, init);
    if (res.status !== 502) return res;
    if (attempt++ >= 2) return res; // 3 tentatives max
    await new Promise(r => setTimeout(r, 300 * attempt));
  }
};

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { global: { fetch: customFetch } }
);

if (__DEV__) console.log('[Supabase] client initialisé');
