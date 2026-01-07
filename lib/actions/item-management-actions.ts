'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

// Get all items for admin
export async function getAllItems(filters?: {
  search?: string
  categoryId?: string
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return []
  }

  let query = supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name, icon),
      images:item_images(
        id,
        image_url,
        display_order
      )
    `)
    .order('created_at', { ascending: false })
    .order('display_order', { foreignTable: 'item_images', ascending: true })

  // Apply filters
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching items:', error)
    return []
  }

  // Apply search filter on client side
  if (filters?.search && data) {
    const searchLower = filters.search.toLowerCase()
    return data.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    )
  }

  return data || []
}

// Create new item
export async function createItem(formData: {
  name: string
  description?: string
  category_id: string
  stock_total: number
  location?: string
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    const { error } = await supabase.from('items').insert({
      ...formData,
      stock_available: formData.stock_total, // Initially, all stock is available
    })

    if (error) {
      console.error('Error creating item:', error)
      return { error: 'Failed to create item' }
    }

    revalidatePath('/admin/items')
    revalidatePath('/catalog')

    return { success: true, message: 'Barang berhasil ditambahkan' }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Update item
export async function updateItem(itemId: string, formData: {
  name: string
  description?: string
  category_id: string
  stock_total: number
  location?: string
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    // Get current item to check stock
    const { data: currentItem } = await supabase
      .from('items')
      .select('stock_total, stock_available')
      .eq('id', itemId)
      .single()

    if (!currentItem) {
      return { error: 'Item not found' }
    }

    // Calculate new available stock if total changed
    let newStockAvailable = formData.stock_total
    if (currentItem.stock_total !== formData.stock_total) {
      const borrowed = currentItem.stock_total - currentItem.stock_available
      newStockAvailable = Math.max(0, formData.stock_total - borrowed)
    } else {
      newStockAvailable = currentItem.stock_available
    }

    const { error } = await supabase
      .from('items')
      .update({
        ...formData,
        stock_available: newStockAvailable,
      })
      .eq('id', itemId)

    if (error) {
      console.error('Error updating item:', error)
      return { error: 'Failed to update item' }
    }

    revalidatePath('/admin/items')
    revalidatePath('/catalog')

    return { success: true, message: 'Barang berhasil diupdate' }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Delete item (soft delete)
export async function deleteItem(itemId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    // Get active borrow request IDs
    const { data: activeRequests } = await supabase
      .from('borrow_requests')
      .select('id')
      .in('status', ['approved', 'borrowed'])

    const activeRequestIds = activeRequests?.map(r => r.id) || []

    // Check if item is currently borrowed
    if (activeRequestIds.length > 0) {
      const { count } = await supabase
        .from('borrow_items')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)
        .in('request_id', activeRequestIds)

      if (count && count > 0) {
        return { error: 'Tidak bisa menghapus barang yang sedang dipinjam' }
      }
    }

    // Hard delete instead of soft delete
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Error deleting item:', error)
      return { error: 'Failed to delete item' }
    }

    revalidatePath('/admin/items')
    revalidatePath('/catalog')

    return { success: true, message: 'Barang berhasil dihapus' }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Create category
export async function createCategory(formData: {
  name: string
  description?: string
  icon: string
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    const { error } = await supabase.from('categories').insert(formData)

    if (error) {
      console.error('Error creating category:', error)
      return { error: 'Failed to create category' }
    }

    revalidatePath('/admin/items')

    return { success: true, message: 'Kategori berhasil ditambahkan' }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Update category
export async function updateCategory(categoryId: string, formData: {
  name: string
  description?: string
  icon: string
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    const { error } = await supabase
      .from('categories')
      .update(formData)
      .eq('id', categoryId)

    if (error) {
      console.error('Error updating category:', error)
      return { error: 'Failed to update category' }
    }

    revalidatePath('/admin/items')
    revalidatePath('/catalog')

    return { success: true, message: 'Kategori berhasil diupdate' }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Delete category
export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    // Check if category has items
    const { count } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)

    if (count && count > 0) {
      return { error: 'Tidak bisa menghapus kategori yang masih memiliki barang aktif' }
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting category:', error)
      return { error: 'Failed to delete category' }
    }

    revalidatePath('/admin/items')
    revalidatePath('/catalog')

    return { success: true, message: 'Kategori berhasil dihapus' }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
