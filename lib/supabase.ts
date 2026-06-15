import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { logger } from '../utils/logger';

// `||` plutôt que `??` : en CI, un secret GitHub absent est injecté comme
// chaîne vide, qui doit retomber sur le fallback.
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hpqfmuzkkxrqoqoabjmb.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcWZtdXpra3hycW9xb2Fiam1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDcyNDgsImV4cCI6MjA5MTAyMzI0OH0.0XeJi3w_XzibExkwp2I1EJjkNCL8eUluf031kzWOaf8';
/* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

if (
  !process.env.EXPO_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL
)
  logger.info('[Supabase] URL publique absente, fallback OpsPilot utilisé.');

if (
  !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
  logger.info('[Supabase] Clé publique absente, fallback OpsPilot utilisé.');

export const customFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(input, init);
      if (res.status !== 502) return res;
      if (attempt++ >= 2) return res; // 3 tentatives max
      await new Promise((r) => setTimeout(r, 300 * attempt));
    } catch (error) {
      if (attempt++ >= 2) throw error;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
};

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { global: { fetch: customFetch } },
);

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
  store_id?: string | null;
  assigned_to?: string | null;
  created_by?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimated_time_minutes?: number | null;
  due_date?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  created_at?: string;
  updated_at?: string;
  // Traçabilité d'exécution (preuve de qui a fait quoi, quand).
  started_at?: string | null;
  completed_at?: string | null;
  ended_at?: string | null;
  duration_minutes?: number | null;
  completed_by_name?: string | null;
  completed_by_matricule?: string | null;
  completion_comment?: string | null;
  proof_photo_url?: string | null;
  // Validation manager.
  validated_by?: string | null;
  validated_by_name?: string | null;
  validated_at?: string | null;
};

export type CorrectiveAction = {
  id: string;
  organization_id: string;
  store_id?: string | null;
  audit_id?: string | null;
  audit_response_id?: string | null;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  due_date?: string | null;
  resolved_at?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Invitation = {
  id: string;
  organization_id: string;
  email: string;
  role: 'admin' | 'manager' | 'employé' | 'stagiaire';
  store_id?: string | null;
  token: string;
  invited_by?: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at?: string;
};

export type Subscription = {
  id: string;
  organization_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan: 'trial' | 'essential' | 'business' | 'enterprise';
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  created_at?: string;
  updated_at?: string;
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
  min_score?: number | null;
  created_at?: string;
  updated_at?: string;
  ai_generated?: boolean;
  is_default?: boolean;
};

export type TrainingChapter = {
  id: string;
  training_id: string;
  title: string;
  body: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type QuizQuestionType =
  | 'qcm_single'
  | 'qcm_multi'
  | 'true_false'
  | 'situation'
  | 'chronological'
  | 'association'
  | 'critical';

export type TrainingQuizQuestion = {
  id: string;
  training_id: string;
  question: string;
  options: string[];
  correct_index: number;
  sort_order: number;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  question_type?: QuizQuestionType | null;
  is_critical?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type TrainingCertificate = {
  id: string;
  user_id: string;
  training_id: string;
  organization_id: string;
  full_name: string;
  training_title: string;
  score: number;
  issued_at: string;
  expires_at?: string | null;
  certificate_number: string;
  created_at?: string;
};

export type UserTrainingProgress = {
  id: string;
  user_id: string;
  training_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  completed_chapter_ids?: string[];
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

export type NotificationPreferences = {
  audit_notifications: boolean;
  action_notifications: boolean;
  training_notifications: boolean;
  weekly_summary: boolean;
};

export type UserPreferences = NotificationPreferences & {
  user_id: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
};

export type AuditTemplate = {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  icon?: string | null;
  estimated_duration?: number | null;
  max_score: number;
  is_active: boolean;
  is_default: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AuditTemplateItem = {
  id: string;
  template_id: string;
  section: string;
  question: string;
  item_type: 'yes_no' | 'score_1_5' | 'text' | 'photo';
  is_required: boolean;
  points: number;
  sort_order: number;
  created_at?: string;
};

export type AuditResponse = {
  id: string;
  audit_id: string;
  item_id: string;
  value?: boolean | number | string | null;
  is_compliant?: boolean | null;
  photo_url?: string | null;
  comment?: string | null;
  // Colonnes historiques conservées par la migration pour compatibilité.
  response_value?: string | null;
  score?: number | null;
  notes?: string | null;
  photos?: string[];
  created_at?: string;
};

/** Alias historique gardé pour les imports existants. */
export type AuditItem = AuditTemplateItem;

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

export type Channel = {
  id: string;
  organization_id: string;
  store_id?: string | null;
  name: string;
  description?: string | null;
  type: 'general' | 'store' | 'department' | 'announcement';
  is_archived?: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ChannelMessage = {
  id: string;
  channel_id: string;
  user_id: string;
  sender_name: string;
  sender_role?: string | null;
  content: string;
  message_type?: 'text' | 'announcement' | 'link';
  is_pinned?: boolean;
  attachment_url?: string | null;
  read_by?: string[];
  created_at?: string;
  updated_at?: string;
};

export type ChannelRead = {
  id?: string;
  user_id: string;
  channel_id: string;
  last_read_at: string;
  created_at?: string;
  updated_at?: string;
};

export type ActivityEventType =
  | 'audit_completed'
  | 'action_resolved'
  | 'training_certified'
  | 'export';

export type ActivityEvent = {
  id: string;
  organization_id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  action: ActivityEventType;
  entity_type: string;
  entity_id?: string | null;
  label: string;
  created_at: string;
};
