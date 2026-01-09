import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with service role privileges.
 * This bypasses Row Level Security (RLS) policies.
 * 
 * ONLY use this for:
 * - Server-side operations that need to bypass RLS
 * - Stock updates during borrow requests
 * - Admin-level system operations
 * 
 * NEVER expose this client to the frontend!
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
