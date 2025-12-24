'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

// Get admin dashboard stats
export async function getAdminStats() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return null
  }

  try {
    // Total items
    const { count: totalItems } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total categories
    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    // Currently borrowed (approved + borrowed status)
    const { count: borrowedCount } = await supabase
      .from('borrow_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'borrowed'])

    // Pending requests
    const { count: pendingCount } = await supabase
      .from('borrow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Awaiting verification (return declared)
    const { count: verificationCount } = await supabase
      .from('borrow_requests')
      .select('*', { count: 'exact', head: true })
      .not('return_declared_at', 'is', null)
      .is('return_verified_at', null)

    // Items with low stock (< 20% of total)
    const { data: itemsData } = await supabase
      .from('items')
      .select('stock_total, stock_available')
      .eq('is_active', true)

    const lowStockCount = itemsData?.filter(item => {
      if (item.stock_total === 0) return false
      const percentage = (item.stock_available / item.stock_total) * 100
      return percentage < 20
    }).length || 0

    return {
      totalItems: totalItems || 0,
      totalCategories: totalCategories || 0,
      borrowedCount: borrowedCount || 0,
      pendingCount: pendingCount || 0,
      verificationCount: verificationCount || 0,
      lowStockCount,
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return null
  }
}

// Get all borrow requests with filters
export async function getAllBorrowRequests(filters?: {
  status?: string
  search?: string
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return []
  }

  let query = supabase
    .from('borrow_requests')
    .select(`
      *,
      user:users!user_id (id, name, nik),
      borrow_items (
        id,
        quantity,
        item:items (id, name, category:categories (name, icon))
      )
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.status) {
    if (filters.status === 'awaiting_verification') {
      query = query.not('return_declared_at', 'is', null).is('return_verified_at', null)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching borrow requests:', error)
    return []
  }

  // Apply search filter on client side if needed
  if (filters?.search && data) {
    const searchLower = filters.search.toLowerCase()
    return data.filter(req =>
      req.user?.name.toLowerCase().includes(searchLower) ||
      req.user?.nik.toLowerCase().includes(searchLower) ||
      req.purpose.toLowerCase().includes(searchLower)
    )
  }

  return data || []
}

// Approve borrow request
export async function approveBorrowRequest(requestId: string, adminNotes?: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('borrow_requests')
      .select('*, borrow_items(item_id, quantity)')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { error: 'Request not found' }
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('borrow_requests')
      .update({
        status: 'approved',
        admin_notes: adminNotes,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (updateError) {
      return { error: 'Failed to approve request' }
    }

    // Update stock for each item
    for (const borrowItem of request.borrow_items || []) {
      const { data: item } = await supabase
        .from('items')
        .select('stock_available')
        .eq('id', borrowItem.item_id)
        .single()

      if (item) {
        await supabase
          .from('items')
          .update({
            stock_available: item.stock_available - borrowItem.quantity
          })
          .eq('id', borrowItem.item_id)
      }
    }

    // Create log
    await supabase.from('borrow_logs').insert({
      request_id: requestId,
      old_status: request.status,
      new_status: 'approved',
      changed_by: user.id,
      notes: adminNotes || 'Request approved by admin',
    })

    revalidatePath('/admin')
    revalidatePath('/admin/requests')

    return { success: true, message: 'Permintaan berhasil disetujui' }
  } catch (error) {
    console.error('Error approving request:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Reject borrow request
export async function rejectBorrowRequest(requestId: string, adminNotes: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    const { data: request, error: fetchError } = await supabase
      .from('borrow_requests')
      .select('status')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return { error: 'Request not found' }
    }

    const { error } = await supabase
      .from('borrow_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
      })
      .eq('id', requestId)

    if (error) {
      return { error: 'Failed to reject request' }
    }

    // Create log
    await supabase.from('borrow_logs').insert({
      request_id: requestId,
      old_status: request.status,
      new_status: 'rejected',
      changed_by: user.id,
      notes: adminNotes,
    })

    revalidatePath('/admin')
    revalidatePath('/admin/requests')

    return { success: true, message: 'Permintaan berhasil ditolak' }
  } catch (error) {
    console.error('Error rejecting request:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Verify return
export async function verifyReturn(requestId: string, adminNotes?: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    // Get request with items
    const { data: request, error: fetchError } = await supabase
      .from('borrow_requests')
      .select('*, borrow_items(item_id, quantity)')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return { error: 'Request not found' }
    }

    // Update request
    const { error } = await supabase
      .from('borrow_requests')
      .update({
        status: 'returned',
        return_verified_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq('id', requestId)

    if (error) {
      return { error: 'Failed to verify return' }
    }

    // Restore stock
    for (const borrowItem of request.borrow_items || []) {
      const { data: item } = await supabase
        .from('items')
        .select('stock_available')
        .eq('id', borrowItem.item_id)
        .single()

      if (item) {
        await supabase
          .from('items')
          .update({
            stock_available: item.stock_available + borrowItem.quantity
          })
          .eq('id', borrowItem.item_id)
      }
    }

    // Create log
    await supabase.from('borrow_logs').insert({
      request_id: requestId,
      old_status: request.status,
      new_status: 'returned',
      changed_by: user.id,
      notes: adminNotes || 'Return verified by admin',
    })

    revalidatePath('/admin')
    revalidatePath('/admin/requests')
    revalidatePath('/catalog')

    return { success: true, message: 'Pengembalian berhasil diverifikasi' }
  } catch (error) {
    console.error('Error verifying return:', error)
    return { error: 'An unexpected error occurred' }
  }
}
