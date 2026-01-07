'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export interface BorrowRequestItem {
  itemId: string
  quantity: number
}

export interface CreateBorrowRequestInput {
  items: BorrowRequestItem[]

  // Request type flag
  isPermanent: boolean

  // Required for borrowing (isPermanent = false), optional for permanent requests
  startDatetime?: string // ISO 8601 datetime string
  endDatetime?: string // ISO 8601 datetime string

  // Common fields
  usageLocation: string
  purpose: string
  notes?: string
  department?: string // Department requesting the item
}

export async function createBorrowRequest(input: CreateBorrowRequestInput) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return {
      error: 'Anda harus login terlebih dahulu untuk meminjam barang',
      requiresAuth: true
    }
  }

  try {
    // Validate usage location
    if (!input.usageLocation || !input.usageLocation.trim()) {
      return { error: 'Lokasi penggunaan harus diisi' }
    }

    // Validate based on request type
    let startDatetime: Date | null = null
    let endDatetime: Date | null = null
    let isSameDay = false

    if (!input.isPermanent) {
      // Borrowing: dates are required
      if (!input.startDatetime || !input.endDatetime) {
        return { error: 'Tanggal mulai dan selesai diperlukan untuk peminjaman barang' }
      }

      startDatetime = new Date(input.startDatetime)
      endDatetime = new Date(input.endDatetime)

      if (isNaN(startDatetime.getTime()) || isNaN(endDatetime.getTime())) {
        return { error: 'Format tanggal/waktu tidak valid' }
      }

      if (endDatetime <= startDatetime) {
        return { error: 'Waktu selesai harus setelah waktu mulai' }
      }

      // Auto-detect if same-day borrowing
      isSameDay = startDatetime.toDateString() === endDatetime.toDateString()

      // Validate based on borrowing type
      if (isSameDay) {
        // Same-day validation
        const timeDiff = (endDatetime.getTime() - startDatetime.getTime()) / (1000 * 60) // minutes
        if (timeDiff < 30) {
          return { error: 'Durasi peminjaman minimal 30 menit' }
        }
      } else {
        // Multi-day validation
        const daysDiff = Math.floor((endDatetime.getTime() - startDatetime.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff < 1) {
          return { error: 'Untuk peminjaman multi-hari, durasi minimal 1 hari penuh' }
        }
      }
    }
    // For permanent requests (isPermanent = true), dates are not required

    // Check if any item is sensitive
    const itemIds = input.items.map(i => i.itemId)
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, is_sensitive, stock_available')
      .in('id', itemIds)

    if (itemsError) {
      return { error: 'Failed to fetch items' }
    }

    // Check stock availability
    for (const requestItem of input.items) {
      const item = items?.find(i => i.id === requestItem.itemId)
      if (!item) {
        return { error: 'Item not found' }
      }
      if (item.stock_available < requestItem.quantity) {
        return { error: `Insufficient stock for item` }
      }
    }

    // All items are immediately borrowed (no approval needed)
    const status = 'borrowed'

    // Create borrow request with new datetime fields
    const { data: borrowRequest, error: requestError } = await supabase
      .from('borrow_requests')
      .insert({
        user_id: user.id,
        is_permanent: input.isPermanent,
        start_datetime: startDatetime?.toISOString() || null,
        end_datetime: endDatetime?.toISOString() || null,
        usage_location: input.usageLocation.trim(),
        is_same_day: isSameDay,
        purpose: input.purpose,
        notes: input.notes,
        department: input.department || null,
        status: status,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .select()
      .single()

    if (requestError) {
      return { error: 'Failed to create borrow request' }
    }

    // Create borrow items (junction table)
    const borrowItems = input.items.map(item => ({
      request_id: borrowRequest.id,
      item_id: item.itemId,
      quantity: item.quantity,
    }))

    const { error: itemsInsertError } = await supabase
      .from('borrow_items')
      .insert(borrowItems)

    if (itemsInsertError) {
      // Rollback: delete the request
      await supabase.from('borrow_requests').delete().eq('id', borrowRequest.id)
      return { error: 'Failed to add items to request' }
    }

    // Update stock immediately (all items are borrowed)
    for (const requestItem of input.items) {
      const item = items?.find(i => i.id === requestItem.itemId)
      if (item) {
        await supabase
          .from('items')
          .update({
            stock_available: item.stock_available - requestItem.quantity
          })
          .eq('id', item.id)
      }
    }

    revalidatePath('/catalog')
    revalidatePath('/dashboard')

    return {
      success: true,
      requestId: borrowRequest.id,
      status: status,
      message: input.isPermanent
        ? 'Permintaan barang berhasil! Silakan ambil barang dari admin.'
        : 'Peminjaman berhasil! Barang sudah bisa diambil.'
    }
  } catch (error) {
    console.error('Error creating borrow request:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getUserBorrowRequests(userId?: string) {
  const supabase = await createClient()
  const user = userId ? { id: userId } : await getCurrentUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('borrow_requests')
    .select(`
      *,
      borrow_items (
        id,
        quantity,
        item:items (
          id,
          name,
          category:categories (name, icon)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching borrow requests:', error)
    return []
  }

  return data
}

export async function declareBorrowReturn(requestId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return {
      error: 'Anda harus login terlebih dahulu',
      requiresAuth: true
    }
  }

  try {
    const { error } = await supabase
      .from('borrow_requests')
      .update({
        status: 'borrowed', // Use 'borrowed' status instead of 'return_declared'
        return_declared_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error declaring return:', error)
      return { error: `Failed to declare return: ${error.message}` }
    }

    // Create log
    const { error: logError } = await supabase.from('borrow_logs').insert({
      request_id: requestId,
      new_status: 'awaiting_verification',
      old_status: 'borrowed',
      changed_by: user.id,
      notes: 'User declared item return, awaiting admin verification',
    })

    if (logError) {
      console.error('Error creating log:', logError)
    }

    revalidatePath('/dashboard')

    return { success: true, message: 'Pengembalian berhasil dilaporkan. Menunggu verifikasi admin.' }
  } catch (error) {
    console.error('Unexpected error in declareBorrowReturn:', error)
    return { error: 'An unexpected error occurred' }
  }
}

