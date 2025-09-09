import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
if (!supabaseUrl) throw new Error('SUPABASE_URL is required')

const supabaseKey = process.env.SUPABASE_SERVICE_KEY
if (!supabaseKey) throw new Error('SUPABASE_SERVICE_KEY is required')

export const supabase = createClient(supabaseUrl, supabaseKey)
