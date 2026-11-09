import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Logged-in user with role, looked up once per request.
 * Layouts, pages and server actions all call getCurrentUser(); without the cache
 * each call repeats the auth check and the users query.
 */
export const getCurrentUserCached = cache(async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user role from database
  const { data: userData } = await supabase
    .from('users')
    .select('id, username, name, nik, role')
    .eq('id', user.id)
    .single()

  return userData
})
