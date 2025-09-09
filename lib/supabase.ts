import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Vérification de la configuration
console.log('🔗 Configuration Supabase:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey && supabaseAnonKey !== 'placeholder-anon-key',
  isConfigured: supabaseUrl !== 'https://placeholder.supabase.co'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Types pour TypeScript
export interface Profile {
  id: string
  organization_id?: string
  store_id?: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'admin' | 'manager' | 'employee'
  level: number
  xp: number
  total_audits: number
  avg_score: number
  completed_trainings: number
  active_time_hours: number
  last_active: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  organization_id: string
  store_id: string
  category_id?: string
  name: string
  barcode?: string
  price: number
  stock_quantity: number
  min_stock_threshold: number
  expiry_date?: string
  status: 'ok' | 'low_stock' | 'out_of_stock' | 'expired'
  image_url?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Audit {
  id: string
  organization_id: string
  store_id: string
  template_id?: string
  auditor_id: string
  title: string
  description?: string
  location?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  score?: number
  max_score: number
  issues_count: number
  photos: string[]
  notes?: string
  started_at?: string
  completed_at?: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  organization_id: string
  store_id: string
  assigned_to: string
  created_by: string
  title: string
  description?: string
  location?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  estimated_time_minutes?: number
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface TrainingCourse {
  id: string
  organization_id: string
  title: string
  description?: string
  content: any
  duration_minutes: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  xp_reward: number
  quiz_questions: any[]
  passing_score: number
  is_mandatory: boolean
  created_at: string
}

export interface TrainingProgress {
  id: string
  user_id: string
  course_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  score?: number
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: 'text' | 'image' | 'file'
  attachments: any[]
  read_by: string[]
  created_at: string
}

export interface Achievement {
  id: string
  organization_id: string
  name: string
  description?: string
  icon: string
  xp_reward: number
  condition_type: string
  condition_value: any
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
}