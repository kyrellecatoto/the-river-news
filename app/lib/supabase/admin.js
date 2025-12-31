import { createClient } from '@supabase/supabase-js'

// This should ONLY be used in server components or API routes
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Service Role Key are required')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}