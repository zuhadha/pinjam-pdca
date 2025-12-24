'use server'

import { createClient } from '@/lib/supabase/server'

export interface Item {
  id: string
  name: string
  description: string | null
  category_id: string | null
  stock_total: number
  stock_available: number
  location: string | null
  photo_url: string | null
  is_sensitive: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    icon: string | null
  } | null
}

export interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
}

export async function getItems(filters?: {
  search?: string
  categoryId?: string
  availableOnly?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name, icon)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters?.availableOnly) {
    query = query.gt('stock_available', 0)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching items:', error)
    return []
  }

  return data as Item[]
}

export async function getCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data as Category[]
}

export async function getItemById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name, icon)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching item:', error)
    return null
  }

  return data as Item
}

export async function getFeaturedItems(limit: number = 6) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name, icon)
    `)
    .eq('is_active', true)
    .gt('stock_available', 0)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured items:', error)
    return []
  }

  return data as Item[]
}
