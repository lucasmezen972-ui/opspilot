import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Validation de la configuration
const isConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && 
                    supabaseAnonKey !== 'placeholder-anon-key' &&
                    supabaseUrl.includes('supabase.co') &&
                    supabaseAnonKey.length > 50

// Vérification de la configuration
console.log('🔗 Configuration Supabase:', {
  url: supabaseUrl,
  urlValid: supabaseUrl !== 'https://placeholder.supabase.co' && supabaseUrl.includes('supabase.co'),
  hasAnonKey: !!supabaseAnonKey && supabaseAnonKey !== 'placeholder-anon-key',
  keyLength: supabaseAnonKey.length,
  isConfigured: isConfigured,
  environment: process.env.NODE_ENV || 'development'
})

// Retry exponentiel pour 502 et timeouts
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let attempt = 0
  
  while (attempt < 3) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
      
      const response = await fetch(input, {
        ...init,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // Retry sur 502 seulement
      if (response.status !== 502) {
        return response
      }
      
      if (attempt >= 2) return response // Max 3 tentatives
      
    } catch (error) {
      if (attempt >= 2) throw error
      console.warn(`🔄 Retry ${attempt + 1}/3:`, error)
    }
    
    attempt++
    await sleep(300 * attempt) // Backoff: 300ms, 600ms, 900ms
  }
  
  throw new Error('Max retries exceeded')
}

// Configuration avec timeout et retry pour éviter les erreurs 502
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

// Types Enterprise complets
export interface Organization {
  id: string
  name: string
  logo_url?: string
  settings: Record<string, any>
  subscription_plan: 'basic' | 'pro' | 'enterprise'
  max_users: number
  max_stores: number
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  organization_id: string
  name: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  latitude?: number
  longitude?: number
  manager_id?: string
  settings: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  organization_id: string
  store_id: string
  name: string
  description?: string
  manager_id?: string
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  store_id?: string
  email: string
  full_name?: string
  phone?: string
  avatar_url?: string
  role: 'admin' | 'manager' | 'employé' | 'stagiaire'
  department_id?: string
  permissions: Record<string, any>
  level: number
  xp: number
  total_audits: number
  avg_score: number
  completed_trainings: number
  active_time_hours: number
  last_active: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuditTemplate {
  id: string
  organization_id: string
  name: string
  description?: string
  category?: string
  estimated_duration?: number
  max_score: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AuditItem {
  id: string
  template_id: string
  question: string
  item_type: 'checkbox' | 'rating' | 'text' | 'photo' | 'numeric'
  is_required: boolean
  points: number
  sort_order: number
  options: any[]
  created_at: string
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

export interface AuditResponse {
  id: string
  audit_id: string
  item_id: string
  response_value?: string
  score: number
  notes?: string
  photos: string[]
  created_at: string
}

export interface Task {
  id: string
  organization_id: string
  store_id?: string
  assigned_to?: string
  created_by?: string
  title: string
  description?: string
  location?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  estimated_time_minutes?: number
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  organization_id: string
  barcode?: string
  name: string
  category?: string
  price?: number
  stock_quantity: number
  min_stock: number
  dlc?: string
  image_url?: string
  added_by?: string
  created_at: string
  updated_at: string
}

export interface Training {
  id: string
  organization_id: string
  title: string
  content?: string
  category?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes?: number
  xp_reward: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserTrainingProgress {
  id: string
  user_id: string
  training_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  score?: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  organization_id: string
  name: string
  description?: string
  type: 'group' | 'direct' | 'support'
  participants: string[]
  last_message_at: string
  created_by?: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  attachments: any[]
  read_by: string[]
  replied_to?: string
  created_at: string
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  title: string
  content?: string
  type: 'info' | 'warning' | 'error' | 'success'
  action_url?: string
  data: Record<string, any>
  is_read: boolean
  is_push_sent: boolean
  created_at: string
}

export interface Badge {
  id: string
  name: string
  icon_url?: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  awarded_at: string
}

export interface AuditPhoto {
  id: string
  organization_id: string
  audit_id: string
  image_url: string
  comment?: string
  file_size?: number
  annotations: any[]
  uploaded_by?: string
  created_at: string
}

export interface Permission {
  id: string
  organization_id: string
  role: string
  resource: string
  actions: string[]
  conditions: Record<string, any>
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  store_id?: string
  session_start: string
  session_end?: string
  duration_minutes?: number
  actions_count: number
  created_at: string
}

export interface Report {
  id: string
  organization_id: string
  store_id?: string
  generated_by?: string
  report_type: 'audit_summary' | 'performance' | 'compliance' | 'analytics'
  title: string
  data: Record<string, any>
  file_url?: string
  date_from?: string
  date_to?: string
  created_at: string
}

export interface AuditSchedule {
  id: string
  organization_id: string
  template_id: string
  store_id: string
  assigned_to?: string
  name: string
  description?: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  frequency_data: Record<string, any>
  next_due_date?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}