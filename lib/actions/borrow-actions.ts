'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { sendBorrowConfirmationEmail, sendAdminBorrowNotificationEmail, createReturnToken } from '@/lib/email/email-service'
import { getAdminNotificationEmails } from '@/lib/actions/settings-actions'
import { generateSecureToken } from '@/lib/utils/token-utils'
import { getCurrentUser } from '@/lib/auth/actions'
import { jakartaDate } from '@/lib/utils/date-utils'

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

  // Admin only (ignored for everyone else)
  requestDate?: string // YYYY-MM-DD, backdate a permanent request
  autoReturned?: boolean // borrowing already happened and items are back
}

function getCategoryName(category: unknown) {
  if (category && typeof category === 'object' && 'name' in category) {
    const name = (category as { name?: unknown }).name
    return typeof name === 'string' ? name : 'Uncategorized'
  }

  return 'Uncategorized'
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

    // Admins may backdate records and log already-returned borrowings
    const currentUser = await getCurrentUser()
    const isAdmin = currentUser?.role === 'admin'
    const autoReturned = isAdmin && !input.isPermanent && !!input.autoReturned
    const today = jakartaDate()

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

      if (!isAdmin && jakartaDate(startDatetime) < today) {
        return { error: 'Tanggal peminjaman tidak boleh sebelum hari ini' }
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
      .select(`
        id, 
        name, 
        stock_total,
        stock_available, 
        is_borrowable,
        category:categories(name),
        units:item_units(id, code, is_available)
      `)
      .in('id', itemIds)

    if (itemsError) {
      return { error: 'Gagal mengambil data barang' }
    }

    // Check stock availability and unit selection
    for (const requestItem of input.items) {
      const item = items?.find((i) => i.id === requestItem.itemId)
      if (!item) {
        return { error: 'Barang tidak ditemukan' }
      }

      if (input.isPermanent && item.is_borrowable) {
        return { error: `${item.name} adalah barang pinjaman dan tidak bisa diminta permanen` }
      }

      if (!input.isPermanent && !item.is_borrowable) {
        return { error: `${item.name} adalah barang permintaan dan tidak bisa dipinjam sementara` }
      }
      
      if (!Number.isInteger(requestItem.quantity) || requestItem.quantity < 1) {
        return { error: `Jumlah tidak valid untuk barang: ${item.name}` }
      }

      // Borrowable items with unit codes need exactly one code per unit borrowed
      if (item.is_borrowable && item.units && item.units.length > 0) {
        const selected = requestItem.selectedUnits || []
        if (selected.length !== requestItem.quantity) {
          return { error: `Pilih ${requestItem.quantity} kode unit untuk barang: ${item.name}` }
        }
        if (new Set(selected.map((u) => u.id)).size !== selected.length) {
          return { error: `Kode unit ganda untuk barang: ${item.name}` }
        }
        for (const unit of selected) {
          const dbUnit = item.units.find((u) => u.id === unit.id)
          if (!dbUnit) {
            return { error: `Kode unit tidak valid untuk barang: ${item.name}` }
          }
          // Already-returned records don't take the unit, so it may be out right now
          if (!autoReturned && !dbUnit.is_available) {
            return { error: `Kode ${dbUnit.code} sedang dipinjam. Silakan pilih kode lain.` }
          }
        }
      }

      if (!autoReturned && item.stock_available < requestItem.quantity) {
        return { error: `Stok tidak mencukupi untuk barang: ${item.name}` }
      }
    }

    // Backdated admin records are dated on the day they happened
    let createdAt: string | undefined
    if (isAdmin) {
      if (startDatetime && startDatetime.getTime() < Date.now()) {
        createdAt = startDatetime.toISOString()
      } else if (input.isPermanent && input.requestDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.requestDate)) {
          return { error: 'Format tanggal permintaan tidak valid' }
        }
        if (input.requestDate > today) {
          return { error: 'Tanggal permintaan tidak boleh di masa depan' }
        }
        // Keep the current time of day, shifted back by whole days
        const daysBack = Math.round((Date.parse(today) - Date.parse(input.requestDate)) / 86_400_000)
        if (daysBack > 0) {
          createdAt = new Date(Date.now() - daysBack * 86_400_000).toISOString()
        }
      }
    }

    const returnedAt = autoReturned && endDatetime
      ? new Date(Math.min(endDatetime.getTime(), Date.now())).toISOString()
      : null

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
        status: autoReturned ? 'returned' : 'borrowed',
        approved_at: createdAt || new Date().toISOString(),
        ...(createdAt ? { created_at: createdAt } : {}),
        ...(autoReturned
          ? {
              return_declared_at: returnedAt,
              return_verified_at: returnedAt,
              admin_notes: 'Dicatat admin: sudah dikembalikan',
            }
          : {}),
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

    // Return the new rows' ids from the insert itself (saves a separate select)
    const { data: insertedBorrowItems, error: itemsInsertError } = await supabase
      .from('borrow_items')
      .insert(borrowItems)
      .select('id, item_id')

    if (itemsInsertError) {
      // Rollback: delete the request
      await supabase.from('borrow_requests').delete().eq('id', borrowRequest.id)
      return { error: 'Gagal menambahkan barang ke permintaan' }
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
      // Insert junction (kept for history even when already returned)
      const { error: junctionError } = await supabase.from('borrow_item_units').insert(borrowItemUnitsToInsert)
      if (junctionError) console.error('Error inserting borrow_item_units', junctionError)
    }

    if (autoReturned) {
      // Items are already back: leave stock untouched, log it and skip emails/return link
      await supabase.from('borrow_logs').insert({
        request_id: borrowRequest.id,
        old_status: 'borrowed',
        new_status: 'returned',
        changed_by: currentUser?.id ?? null,
        notes: 'Dicatat admin sebagai sudah dikembalikan',
      })

      revalidatePath('/catalog')
      revalidatePath('/admin')
      revalidatePath('/admin/requests')
      revalidatePath('/admin/items')

      return {
        success: true,
        requestId: borrowRequest.id,
        borrowerName: input.borrowerName.trim(),
        borrowerEmail: input.borrowerEmail.trim(),
        itemCount: input.items.length,
        message: 'Riwayat peminjaman berhasil dicatat sebagai sudah dikembalikan.',
      }
    }

    if (unitIdsToUpdate.length > 0) {
      // Update units availability to false (this triggers items stock_available decrement)
      const { error: unitsUpdateError } = await supabase
        .from('item_units')
        .update({ is_available: false })
        .in('id', unitIdsToUpdate)
      if (unitsUpdateError) console.error('Error updating item_units', unitsUpdateError)
    }

    // In cases where user requested quantity manually but didn't select units
    // (requestable/permanent items or legacy items without units), update item stock directly.
    // Each item is a different row, so the updates can run in parallel
    await Promise.all(input.items.map(async (requestItem) => {
      const dbItem = items?.find((i) => i.id === requestItem.itemId)
      if (!dbItem) return

      const selectedCount = requestItem.selectedUnits?.length || 0
      const quantityToDecrement = requestItem.quantity - selectedCount

      if (quantityToDecrement <= 0) {
        return
      }

      const newStock = dbItem.stock_available - quantityToDecrement
      const stockUpdate = input.isPermanent && !dbItem.is_borrowable
        ? { stock_total: newStock, stock_available: newStock }
        : { stock_available: newStock }

      const { error: stockError } = await supabase
        .from('items')
        .update(stockUpdate)
        .eq('id', dbItem.id)

      if (stockError) {
        console.error('Failed to update stock for item:', dbItem.id, stockError)
      }
    }))

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
    const [tokenCreated, adminEmails] = await Promise.all([
      createReturnToken(borrowRequest.id, returnToken, tokenExpiresAt),
      getAdminNotificationEmails(),
    ])

    if (!tokenCreated) {
      console.error('Failed to create return token for request:', borrowRequest.id)
    }

    // Email content
    const emailItems = input.items.map((ri) => {
      const item = items?.find((i) => i.id === ri.itemId)
      return {
        name: item?.name || 'Barang',
        quantity: ri.quantity,
        category: getCategoryName(item?.category),
      }
    })

    // Send emails after the response is returned, so the borrower doesn't wait for
    // the mail provider (and the 2s admin delay). after() keeps the work alive on
    // serverless hosts as well, which is why it used to be awaited here.
    after(async () => {
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

      // Admin notification with 2s delay, after the borrower's email
      if (adminEmails.length > 0) {
        await sendAdminBorrowNotificationEmail({
          adminEmails,
          borrowerName: input.borrowerName.trim(),
          borrowerEmail: input.borrowerEmail.trim().toLowerCase(),
          borrowerDivision: input.borrowerDivision.trim(),
          items: emailItems,
          startDatetime: startDatetime?.toISOString() || null,
          endDatetime: endDatetime?.toISOString() || null,
          usageLocation: input.usageLocation.trim(),
          purpose: input.purpose,
          isPermanent: input.isPermanent,
          requestId: borrowRequest.id,
        }, 2000).catch((err) => {
          console.error('Failed to send admin notification emails:', err)
        })
      }
    })

    revalidatePath('/catalog')
    revalidatePath('/admin')
    revalidatePath('/admin/requests')
    revalidatePath('/admin/permanent-requests')
    revalidatePath('/admin/items')

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
