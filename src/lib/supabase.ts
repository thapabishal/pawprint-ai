import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // In development, we might not have these yet, so we'll use placeholders
  // to avoid crashing during initial setup/linting
  console.warn('Missing Supabase environment variables. Using placeholder client.')
}

// Singleton — import this everywhere, never create a new client
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
