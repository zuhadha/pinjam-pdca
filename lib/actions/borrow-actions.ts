'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'
import { sendBorrowConfirmationEmail, createReturnToken } from '@/lib/email/email-service'
import { generateSecureToken } from '@/lib/utils/token-utils'

export interface BorrowRequestItem {
  itemId: string
  quantity: number
  selectedUnits?: {id: string, code: string}[]
}

export interface CreateBorrowRequestInput {
  items: BorrowRequestItem[]

  // Borrower identity (no auth required)
  borrowerName: string
  borrowerEmail: string
  borrowerDivision: string

  // Request type flag
  isPermanent: boolean

  // Required for borrowing (isPermanent = false)
  startDatetime?: string // ISO 8601 datetime string
  endDatetime?: string // ISO 8601 datetime string

  // Common fields
  usageLocation: string
  purpose: string
  notes?: string
}

export async function createBorrowRequest(input: CreateBorrowRequestInput) {
  // Use service role client to bypass RLS (anonymous requests allowed)
  const supabase = createServiceRoleClient()

  try {
    // Validate borrower identity
    if (!input.borrowerName?.trim()) {
      return { error: 'Nama harus diisi' }
    }
    if (!input.borrowerEmail?.trim()) {
      return { error: 'Email harus diisi' }
    }
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.borrowerEmail.trim())) {
      return { error: 'Format email tidak valid' }
    }
    if (!input.borrowerDivision?.trim()) {
      return { error: 'Divisi harus diisi' }
    }

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

      if (isSameDay) {
        const timeDiff = (endDatetime.getTime() - startDatetime.getTime()) / (1000 * 60) // minutes
        if (timeDiff < 30) {
          return { error: 'Durasi peminjaman minimal 30 menit' }
        }
      } else {
        const daysDiff = Math.floor(
          (endDatetime.getTime() - startDatetime.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysDiff < 1) {
          return { error: 'Untuk peminjaman multi-hari, durasi minimal 1 hari penuh' }
        }
      }
    }

    // Fetch items for stock check
    const itemIds = input.items.map((i) => i.itemId)
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, name, stock_available, category:categories(name)')
      .in('id', itemIds)

    if (itemsError) {
      return { error: 'Gagal mengambil data barang' }
    }

    // Check stock availability
    for (const requestItem of input.items) {
      const item = items?.find((i) => i.id === requestItem.itemId)
      if (!item) {
        return { error: 'Barang tidak ditemukan' }
      }
      if (item.stock_available < requestItem.quantity) {
        return { error: `Stok tidak mencukupi untuk barang: ${item.name}` }
      }
    }

    // Create borrow request (no user_id needed)
    const { data: borrowRequest, error: requestError } = await supabase
      .from('borrow_requests')
      .insert({
        borrower_name: input.borrowerName.trim(),
        borrower_email: input.borrowerEmail.trim().toLowerCase(),
        borrower_division: input.borrowerDivision.trim(),
        is_permanent: input.isPermanent,
        start_datetime: startDatetime?.toISOString() || null,
        end_datetime: endDatetime?.toISOString() || null,
        usage_location: input.usageLocation.trim(),
        is_same_day: isSameDay,
        purpose: input.purpose,
        notes: input.notes,
        status: 'borrowed',
        approved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating borrow request:', requestError)
      return { error: 'Gagal membuat permintaan peminjaman' }
    }

    // Create borrow items (junction table)
    const borrowItems = input.items.map((item) => ({
      request_id: borrowRequest.id,
      item_id: item.itemId,
      quantity: item.quantity,
    }))

    const { error: itemsInsertError } = await supabase.from('borrow_items').insert(borrowItems)

    if (itemsInsertError) {
      // Rollback: delete the request
      await supabase.from('borrow_requests').delete().eq('id', borrowRequest.id)
      return { error: 'Gagal menambahkan barang ke permintaan' }
    }

    // Retrieve newly inserted borrow_items to get their IDs
    const { data: insertedBorrowItems, error: getItemsError } = await supabase
      .from('borrow_items')
      .select('id, item_id')
      .eq('request_id', borrowRequest.id)
    
    if (getItemsError) {
      console.error('Error fetching inserted borrow items:', getItemsError)
    }

    // Process selected item units
    const borrowItemUnitsToInsert = []
    const unitIdsToUpdate = []
    
    for (const item of input.items) {
      if (item.selectedUnits && item.selectedUnits.length > 0) {
        const dbBorrowItem = insertedBorrowItems?.find(bi => bi.item_id === item.itemId)
        if (dbBorrowItem) {
          for (const unit of item.selectedUnits) {
            borrowItemUnitsToInsert.push({
              borrow_item_id: dbBorrowItem.id,
              item_unit_id: unit.id
            })
            unitIdsToUpdate.push(unit.id)
          }
        }
      }
    }

    if (borrowItemUnitsToInsert.length > 0) {
      // Insert junction
      const { error: junctionError } = await supabase.from('borrow_item_units').insert(borrowItemUnitsToInsert)
      if (junctionError) console.error('Error inserting borrow_item_units', junctionError)
      
      // Update units availability to false (this triggers items stock_available decrement)
      const { error: unitsUpdateError } = await supabase
        .from('item_units')
        .update({ is_available: false })
        .in('id', unitIdsToUpdate)
      if (unitsUpdateError) console.error('Error updating item_units', unitsUpdateError)
    }

    // In cases where user requested quantity manually but didn't select units
    // (legacy or items without units), items.stock_available must still decrease.
    // However, the new system syncs items stock from item_units triggers exclusively.
    // Wait! If the system exclusively uses triggers, how do legacy items decrement?
    // We should probably check if the item HAS units. If it doesn't, we can fallback to manual decrement.
    for (const requestItem of input.items) {
      const dbItem = items?.find((i) => i.id === requestItem.itemId)
      if (dbItem) {
        // Did they select units for ALL the requested quantity?
        const selectedCount = requestItem.selectedUnits?.length || 0
        if (selectedCount < requestItem.quantity) {
          // Manually decrement the remainder from the items table since there are no unit codes applied
          const newStock = dbItem.stock_available - (requestItem.quantity - selectedCount)
          const { error: stockError } = await supabase
            .from('items')
            .update({ stock_available: newStock })
            .eq('id', dbItem.id)

          if (stockError) {
            console.error('Failed to update stock for item:', dbItem.id, stockError)
          }
        }
      }
    }

    // Create return token (reusable, valid for end_datetime + 30 days or 60 days for permanent)
    let tokenExpiresAt: Date
    if (endDatetime) {
      tokenExpiresAt = new Date(endDatetime)
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30)
    } else {
      tokenExpiresAt = new Date()
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60)
    }

    const returnToken = generateSecureToken()
    const tokenCreated = await createReturnToken(borrowRequest.id, returnToken, tokenExpiresAt)

    if (!tokenCreated) {
      console.error('Failed to create return token for request:', borrowRequest.id)
    }

    // Send confirmation email (fire-and-forget, don't block response)
    const emailItems = input.items.map((ri) => {
      const item = items?.find((i) => i.id === ri.itemId)
      return {
        name: item?.name || 'Barang',
        quantity: ri.quantity,
        category: (item?.category as any)?.name || 'Uncategorized',
      }
    })

    // Send email (awaiting is necessary for Serverless functions to finish before exit)
    await sendBorrowConfirmationEmail({
      borrowerEmail: input.borrowerEmail.trim().toLowerCase(),
      borrowerName: input.borrowerName.trim(),
      borrowerDivision: input.borrowerDivision.trim(),
      items: emailItems,
      startDatetime: startDatetime?.toISOString() || null,
      endDatetime: endDatetime?.toISOString() || null,
      usageLocation: input.usageLocation.trim(),
      purpose: input.purpose,
      isPermanent: input.isPermanent,
      returnToken: tokenCreated ? returnToken : '',
    }).catch((err) => {
      console.error('Failed to send confirmation email:', err)
    })

    revalidatePath('/catalog')
    revalidatePath('/admin')
    revalidatePath('/admin/requests')

    return {
      success: true,
      requestId: borrowRequest.id,
      borrowerName: input.borrowerName.trim(),
      borrowerEmail: input.borrowerEmail.trim(),
      itemCount: input.items.length,
      message: input.isPermanent
        ? 'Permintaan barang berhasil! Cek email Anda untuk konfirmasi.'
        : 'Peminjaman berhasil! Cek email Anda untuk konfirmasi dan link pengembalian.',
    }
  } catch (error) {
    console.error('Error creating borrow request:', error)
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' }
  }
}
