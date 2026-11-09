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
  location?: string
  is_borrowable?: boolean
  units: { code: string }[]
  stock_quantity?: number
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    const isBorrowable = formData.is_borrowable ?? true

    const { data: newItem, error } = await supabase.from('items').insert({
      name: formData.name,
      description: formData.description,
      category_id: formData.category_id,
      location: formData.location,
      is_borrowable: isBorrowable,
      stock_total: isBorrowable ? 0 : (formData.stock_quantity || 0),
      stock_available: isBorrowable ? 0 : (formData.stock_quantity || 0),
    }).select().single()

    if (error || !newItem) {
      console.error('Error creating item:', error)
      return { error: 'Failed to create item' }
    }

    // Only insert units for borrowable items
    if (isBorrowable && formData.units && formData.units.length > 0) {
      const unitsToInsert = formData.units.map(unit => ({
        item_id: newItem.id,
        code: unit.code,
        is_available: true,
        condition: 'good'
      }))

      const { error: unitsError } = await supabase.from('item_units').insert(unitsToInsert)
      if (unitsError) {
        console.error('Error creating item units:', unitsError)
        return { error: 'Item created but failed to create units' }
      }
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
  location?: string
  is_borrowable?: boolean
  units: { id?: string, code: string }[]
  stock_quantity?: number
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    const isBorrowable = formData.is_borrowable ?? true

    // Update core item fields
    const updatePayload: any = {
      name: formData.name,
      description: formData.description,
      category_id: formData.category_id,
      location: formData.location,
      is_borrowable: isBorrowable,
    }

    // For non-borrowable items, directly update stock
    if (!isBorrowable) {
      updatePayload.stock_total = formData.stock_quantity || 0
      updatePayload.stock_available = formData.stock_quantity || 0
    }

    const { error } = await supabase
      .from('items')
      .update(updatePayload)
      .eq('id', itemId)

    if (error) {
      console.error('Error updating item:', error)
      return { error: 'Failed to update item' }
    }

    // Only sync units for borrowable items
    if (!isBorrowable) {
      revalidatePath('/admin/items')
      revalidatePath('/catalog')
      return { success: true, message: 'Barang berhasil diperbarui' }
    }

    // Handle units syncing
    const { data: existingUnits } = await supabase.from('item_units').select('id, code').eq('item_id', itemId)
    const existingUnitIds = new Set((existingUnits || []).map(u => u.id))
    
    const incomingUnitIds = new Set(formData.units.filter(u => u.id).map(u => u.id))
    
    // 1. Delete units that are no longer in the payload
    const unitsToDelete = [...existingUnitIds].filter(id => !incomingUnitIds.has(id))
    if (unitsToDelete.length > 0) {
      // NOTE: Deleting might fail if the unit is actively referenced in borrow_item_units. 
      // Supabase CASCADE on delete will delete the history! So maybe we should just set them as is_available = false?
      // Since admin explicitly deleted them, we try to delete. If it fails, they must be disabled.
      const { error: deleteError } = await supabase.from('item_units').delete().in('id', unitsToDelete)
      if (deleteError) {
        console.error('Error deleting units:', deleteError)
        return { error: 'Failed to delete some units because they are in used.' }
      }
    }

    // 2. Insert new units
    const unitsToInsert = formData.units.filter(u => !u.id).map(u => ({
      item_id: itemId,
      code: u.code,
      is_available: true,
      condition: 'good'
    }))
    if (unitsToInsert.length > 0) {
      const { error: insertError } = await supabase.from('item_units').insert(unitsToInsert)
      if (insertError) {
        console.error('Error inserting units:', insertError)
        return { error: 'Failed to insert new units' }
      }
    }

    // 3. Update existing units (if code changed)
    for (const unit of formData.units.filter(u => u.id)) {
      const existing = (existingUnits || []).find(e => e.id === unit.id)
      if (existing && existing.code !== unit.code) {
        const { error: updateUnitError } = await supabase.from('item_units').update({ code: unit.code }).eq('id', unit.id)
        if (updateUnitError) {
          console.error('Error updating unit:', updateUnitError)
          return { error: `Failed to update unit ${unit.code}` }
        }
      }
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
    // Get active borrow request IDs.
    // Permanent requests (permintaan) keep status 'borrowed' forever because nothing is
    // returned, so they must not count as "currently borrowed" or request items could
    // never be deleted.
    // One query: count this item's rows whose request is still active
    // (inner join instead of loading every active request id first).
    const { count } = await supabase
      .from('borrow_items')
      .select('id, borrow_requests!inner(id)', { count: 'exact', head: true })
      .eq('item_id', itemId)
      .in('borrow_requests.status', ['approved', 'borrowed'])
      .eq('borrow_requests.is_permanent', false)

    // Check if item is currently borrowed
    if (count && count > 0) {
      return { error: 'Tidak bisa menghapus barang yang sedang dipinjam' }
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

// Get Category by ID
export async function getCategoryById(categoryId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data
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
