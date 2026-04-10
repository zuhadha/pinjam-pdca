'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface LoginResult {
  error?: string
  success?: boolean
}

export async function loginAction(
  username: string,
  password: string
): Promise<LoginResult> {
  const supabase = await createClient()

  // For now, we'll use email auth with username@internal.local format
  // This will be properly configured when we set up the database
  const email = `${username}@internal.local`

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getCurrentUser() {
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
}
