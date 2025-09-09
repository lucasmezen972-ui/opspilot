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

if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[Supabase] client initialisé');

export interface Audit {
  id: string
  organization_id: string
  store_id: string | null
  auditor_id: string
  title: string
  description: string | null
  location: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  score: number | null
  max_score: number
  issues_count: number
  photos: string[]
  notes: string | null
  started_at: string | null
  completed_at: string | null
  due_date: string | null
  start_latitude: number | null
  start_longitude: number | null
  end_latitude: number | null
  end_longitude: number | null
  created_at: string
  updated_at: string
  profiles?: { full_name: string } | null
  stores?: { name: string } | null
}
