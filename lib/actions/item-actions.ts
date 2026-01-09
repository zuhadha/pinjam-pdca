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
  is_borrowable: boolean
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    icon: string | null
  } | null
  images?: {
    id: string
    image_url: string
    display_order: number
  }[]
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
      category:categories(id, name, icon),
      images:item_images(id, image_url, display_order)
    `)
    .order('stock_available', { ascending: false }) // Items with stock first
    .order('name', { ascending: true }) // Then alphabetically
    .order('display_order', { foreignTable: 'item_images', ascending: true })

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
      category:categories(id, name, icon),
      images:item_images(id, image_url, display_order)
    `)
    .eq('id', id)
    .order('display_order', { foreignTable: 'item_images', ascending: true })
    .single()

  if (error) {
    console.error('Error fetching item:', error)
    return null
  }

  return data as Item
}

export async function getFeaturedItems(limit: number = 6) {
  const supabase = await createClient()

  // Get items with highest borrow frequency
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name, icon),
      images:item_images(id, image_url, display_order),
      borrow_items(item_id)
    `)
    .gt('stock_available', 0) // Only show available items
    .order('display_order', { foreignTable: 'item_images', ascending: true })

  if (error) {
    console.error('Error fetching featured items:', error)
    return []
  }

  // Calculate borrow count and sort by popularity
  const itemsWithCount = (data as any[]).map(item => ({
    ...item,
    borrow_count: item.borrow_items?.length || 0
  }))

  // Sort by borrow frequency (desc), then by name
  itemsWithCount.sort((a, b) => {
    if (b.borrow_count !== a.borrow_count) {
      return b.borrow_count - a.borrow_count
    }
    return a.name.localeCompare(b.name)
  })

  // Remove borrow_items from response and limit
  return itemsWithCount.slice(0, limit).map(({ borrow_items, ...item }) => item) as Item[]
}
