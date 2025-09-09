import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY)
  throw new Error('Supabase env vars missing');

export const customFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  let attempt = 0;
  while (true) {
    const res = await fetch(input, init);
    if (res.status !== 502) return res;
    if (attempt++ >= 2) return res; // 3 tentatives max
    await new Promise((r) => setTimeout(r, 300 * attempt));
  }
};

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { global: { fetch: customFetch } },
);

if (typeof __DEV__ !== 'undefined' && __DEV__)
  console.log('[Supabase] client initialisé');

export type Audit = {
  id: string;
  organization_id: string;
  store_id?: string | null;
  template_id?: string | null;
  auditor_id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  score?: number | null;
  max_score: number;
  issues_count: number;
  photos: string[];
  notes?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  start_latitude?: number | null;
  start_longitude?: number | null;
  end_latitude?: number | null;
  end_longitude?: number | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  attachments: any[];
  read_by: string[];
  created_at: string;
};

export type Product = {
  id: string;
  organization_id: string;
  store_id?: string | null;
  name: string;
  barcode?: string | null;
  stock_quantity: number;
  status: 'ok' | 'low_stock' | 'out_of_stock';
  updated_at?: string | null;
  min_stock?: number | null;
  image_url?: string | null;
  category?: string | null;
  price?: number | null;
  dlc?: string | null;
};

export type Task = {
  id: string;
  organization_id: string;
  store_id: string;
  assigned_to: string;
  created_by: string;
  title: string;
  description?: string | null;
  location?: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimated_time_minutes?: number | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
};

export type TrainingCourse = {
  id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  xp_reward: number;
  passing_score: number;
  created_at?: string;
  updated_at?: string;
  ai_generated?: boolean;
};

export type TrainingProgress = {
  id: string;
  user_id: string;
  course_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  started_at?: string | null;
  completed_at?: string | null;
  score?: number | null;
};
