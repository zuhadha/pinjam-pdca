'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
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

    // Total categories
    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    // Currently borrowed (borrowed status only)
    const { count: borrowedCount } = await supabase
      .from('borrow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'borrowed')

    // Awaiting verification (return declared but not yet verified)
    const { count: verificationCount } = await supabase
      .from('borrow_requests')
      .select('*', { count: 'exact', head: true })
      .not('return_declared_at', 'is', null)
      .is('return_verified_at', null)

    // Items with low stock (< 20% of total)
    const { data: itemsData } = await supabase
      .from('items')
      .select('stock_total, stock_available')

    const lowStockCount =
      itemsData?.filter((item) => {
        if (item.stock_total === 0) return false
        const percentage = (item.stock_available / item.stock_total) * 100
        return percentage < 20
      }).length || 0

    return {
      totalItems: totalItems || 0,
      totalCategories: totalCategories || 0,
      borrowedCount: borrowedCount || 0,
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
  isPermanent?: boolean
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
      borrow_items (
        id,
        quantity,
        item:items (
          id, 
          name, 
          category:categories (name, icon),
          units:item_units(id, code, is_available)
        ),
        borrow_item_units (
          id,
          item_unit:item_units (id, code, is_available)
        )
      )
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.isPermanent !== undefined) {
    query = query.eq('is_permanent', filters.isPermanent)
  }

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

  // Apply search filter (by borrower_name, borrower_email, borrower_division, or purpose)
  if (filters?.search && data) {
    const searchLower = filters.search.toLowerCase()
    return data.filter(
      (req) =>
        req.borrower_name?.toLowerCase().includes(searchLower) ||
        req.borrower_email?.toLowerCase().includes(searchLower) ||
        req.borrower_division?.toLowerCase().includes(searchLower) ||
        req.purpose?.toLowerCase().includes(searchLower)
    )
  }

  return data || []
}

// Verify return (admin can verify regardless of whether user declared return)
export async function verifyReturn(requestId: string, adminNotes?: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  // Use service role client to restore stock (bypasses RLS)
  const serviceClient = createServiceRoleClient()

  try {
    // Get request with items
    const { data: request, error: fetchError } = await supabase
      .from('borrow_requests')
      .select('*, borrow_items(id, item_id, quantity, borrow_item_units(item_unit_id))')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return { error: 'Data peminjaman tidak ditemukan' }
      return { error: 'Request not found' }
    }

    // Restore stock: Find which items need to be returned
    // First, try to restore through item_units if codes were assigned
    const unitIdsToRestore = []
    
    for (const borrowItem of request.borrow_items) {
      if (borrowItem.borrow_item_units && borrowItem.borrow_item_units.length > 0) {
        for (const  biu of borrowItem.borrow_item_units) {
          unitIdsToRestore.push(biu.item_unit_id)
        }
      } else {
        // Fallback for legacy requests without units
        const { data: item } = await serviceClient
          .from('items')
          .select('stock_available')
          .eq('id', borrowItem.item_id)
          .single()

        if (item) {
          await serviceClient
            .from('items')
            .update({
              stock_available: item.stock_available + borrowItem.quantity,
            })
            .eq('id', borrowItem.item_id)
        }
      }
    }

    if (unitIdsToRestore.length > 0) {
      // Mark units as available again (trigger handles items sync)
      await serviceClient.from('item_units')
        .update({ is_available: true })
        .in('id', unitIdsToRestore)
    }

    // Update request to returned
    const { error } = await supabase
      .from('borrow_requests')
      .update({
        status: 'returned',
        return_verified_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq('id', requestId)

    if (error) {
      return { error: 'Gagal memverifikasi pengembalian' }
    }

    // Create audit log (changed_by = admin user id)
    await supabase.from('borrow_logs').insert({
      request_id: requestId,
      old_status: 'borrowed',
      new_status: 'returned',
      changed_by: user.id,
      notes: adminNotes || 'Barang dikembalikan',
    })

    revalidatePath('/admin')
    revalidatePath('/admin/requests')
    revalidatePath('/catalog')
    return { success: true, message: 'Barang berhasil diverifikasi' }
  } catch (error) {
    console.error('Error verifying return:', error)
    return { error: 'Terjadi kesalahan sistem' }
  }
}

export async function assignUnitsToRequest(requestId: string, assignments: { borrowItemId: string, unitIds: string[] }[]) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const serviceClient = createServiceRoleClient()

  try {
    const unitsToInsert = []
    const unitIdsToUpdate = []

    for (const assignment of assignments) {
      for (const unitId of assignment.unitIds) {
        unitsToInsert.push({
          borrow_item_id: assignment.borrowItemId,
          item_unit_id: unitId
        })
        unitIdsToUpdate.push(unitId)
      }
    }

    if (unitsToInsert.length > 0) {
      // 1. Insert junction records
      const { error: insertError } = await serviceClient
        .from('borrow_item_units')
        .insert(unitsToInsert)

      if (insertError) {
        console.error('Error assigning units:', insertError)
        return { error: 'Gagal meng-assign kode unit' }
      }

      // 2. Update units to unavailable (trigger syncs items.stock_available)
      const { error: updateError } = await serviceClient
        .from('item_units')
        .update({ is_available: false })
        .in('id', unitIdsToUpdate)

      if (updateError) {
        console.error('Error updating unit status:', updateError)
        return { error: 'Berhasil meng-assign namun gagal update status stok' }
      }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/requests')
    revalidatePath('/catalog')
    return { success: true }
  } catch (error) {
    console.error('Error in assignUnitsToRequest:', error)
    return { error: 'Terjadi kesalahan sistem' }
  }
}
