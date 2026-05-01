'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export interface AppSetting {
  key: string
  value: string
  label?: string
  description?: string
  updated_at?: string
}

/**
 * Get a specific setting value by key.
 * Uses service role client so it can be called from server actions without auth.
 */
export async function getSettingValue(key: string): Promise<string | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error || !data) {
    return null
  }

  return data.value
}

/**
 * Get all settings. Admin only.
 */
export async function getAllSettings(): Promise<AppSetting[]> {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return []
  }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .order('key')

  if (error) {
    console.error('Error fetching settings:', error)
    return []
  }

  return data || []
}

/**
 * Update a setting value. Admin only.
 */
export async function updateSetting(key: string, value: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value }, { onConflict: 'key' })

  if (error) {
    console.error('Error updating setting:', error)
    return { error: 'Gagal menyimpan pengaturan' }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

/**
 * Get admin notification emails as an array.
 * Parses the comma-separated value from app_settings.
 */
export async function getAdminNotificationEmails(): Promise<string[]> {
  const value = await getSettingValue('admin_notification_emails')

  if (!value || !value.trim()) {
    return []
  }

  return value
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
}
