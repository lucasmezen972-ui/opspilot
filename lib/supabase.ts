import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isDemoMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

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

// En mode démo, on crée un client factice avec une URL placeholder
// Les hooks vérifieront isDemoMode avant d'appeler Supabase
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  { global: { fetch: customFetch } },
);

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  if (isDemoMode) {
    console.log('[Supabase] Mode démo activé (pas de configuration Supabase)');
  } else {
    console.log('[Supabase] Client initialisé');
  }
}

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
  message_type: 'text' | 'image' | 'file' | 'system';
  attachments: any[];
  read_by: string[];
  created_at: string;
};

export type Product = {
  id: string;
  organization_id: string;
  name: string;
  barcode?: string | null;
  category?: string | null;
  price?: number | null;
  stock_quantity: number;
  min_stock?: number | null;
  dlc?: string | null;
  image_url?: string | null;
  added_by?: string | null;
  created_at: string;
  updated_at: string;
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

export type Training = {
  id: string;
  organization_id: string;
  title: string;
  content?: string | null;
  category?: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  xp_reward: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  ai_generated?: boolean;
};

export type UserTrainingProgress = {
  id: string;
  user_id: string;
  training_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  score?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Organization = {
  id: string;
  name: string;
  logo_url?: string | null;
  settings: Record<string, any>;
  subscription_plan: 'basic' | 'pro' | 'enterprise';
  max_users: number;
  max_stores: number;
  created_at: string;
  updated_at: string;
};

export type Store = {
  id: string;
  organization_id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  manager_id?: string | null;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Department = {
  id: string;
  organization_id: string;
  store_id?: string | null;
  name: string;
  description?: string | null;
  manager_id?: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  organization_id?: string | null;
  store_id?: string | null;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: 'admin' | 'manager' | 'employé' | 'employee' | 'stagiaire';
  department_id?: string | null;
  level: number;
  xp: number;
  total_audits: number;
  avg_score: number;
  completed_trainings: number;
  active_time_hours: number;
  last_active: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

export type AuditItem = {
  id: string;
  template_id: string;
  question: string;
  item_type: 'checkbox' | 'rating' | 'text' | 'photo' | 'numeric';
  is_required: boolean;
  points: number;
  sort_order: number;
  options: any;
  created_at: string;
};

export type AuditResponse = {
  id: string;
  audit_id: string;
  item_id: string;
  response_value?: string | null;
  score: number;
  notes?: string | null;
  photos: string[];
  created_at: string;
};

export type AuditPhoto = {
  id: string;
  organization_id: string;
  audit_id: string;
  image_url: string;
  comment?: string | null;
  file_size?: number | null;
  annotations: any;
  uploaded_by?: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  type: 'group' | 'direct' | 'support';
  participants: string[];
  last_message_at: string;
  created_by?: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  content?: string | null;
  notification_type: 'info' | 'warning' | 'error' | 'success';
  action_url?: string | null;
  data: any;
  is_read: boolean;
  is_push_sent: boolean;
  created_at: string;
};

export type Report = {
  id: string;
  organization_id: string;
  store_id?: string | null;
  generated_by?: string | null;
  report_type: 'audit_summary' | 'performance' | 'compliance' | 'analytics';
  title: string;
  data: any;
  file_url?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  created_at: string;
};

export type Badge = {
  id: string;
  name: string;
  description?: string | null;
  icon_url?: string | null;
  requirements: any;
  created_at: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
};

export type UserSession = {
  id: string;
  user_id: string;
  store_id?: string | null;
  session_start: string;
  session_end?: string | null;
  duration_minutes?: number | null;
  actions_count: number;
  created_at: string;
};
