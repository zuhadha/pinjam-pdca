'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getCurrentUser } from '@/lib/auth/actions'
import { MAX_ROOM_IMAGES, ROOM_DAY_END, ROOM_DAY_START, ROOM_IMAGE_BUCKET, ROOM_SLOT_MINUTES } from '@/lib/rooms/constants'
import { isDateString, isTimeString, shortTime, timeToMinutes, timesOverlap, todayJakarta } from '@/lib/rooms/dates'
import {
  RESERVATION_FULL_FIELDS,
  fetchBookings,
  fetchRooms,
  mapBooking,
  toEmailReservation,
  type BookingRow,
  type ReservationRow,
} from '@/lib/rooms/queries'
import { sendRoomStatusEmail } from '@/lib/email/room-email'
import type { CalendarBooking, Room, RoomStatus } from '@/lib/rooms/types'

const BOOKING_ADMIN_SELECT = `id, reservation_id, room_id, booking_date, start_time, end_time, status, created_at,
  room_reservations!inner(borrower_name, department, agenda, people_count, recurrence_type, phone_number, email, participants, notes, manage_token)`

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') throw new Error('Unauthorized')
  return user
}

function refresh() {
  revalidatePath('/admin')
  revalidatePath('/admin/room-bookings')
  revalidatePath('/admin/rooms')
  revalidatePath('/rooms')
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export interface WaitlistEntry {
  booking: CalendarBooking
  room_name: string
  /** position in the queue for this slot, 1 = next in line */
  position: number
  /** confirmed bookings this one waits behind; empty means it can be confirmed now */
  blockers: CalendarBooking[]
}

export interface AdminRoom extends Room {
  upcoming_count: number
}

export interface RoomAdminData {
  today: string
  rooms: AdminRoom[]
  waitlist: WaitlistEntry[]
  todayCount: number
}

export async function getRoomAdminData(): Promise<RoomAdminData> {
  await requireAdmin()
  const supabase = createServiceRoleClient()
  const today = todayJakarta()

  const [rooms, waitRows, upcoming] = await Promise.all([
    fetchRooms(supabase, { includeMaintenance: true }),
    supabase
      .from('room_bookings')
      .select(BOOKING_ADMIN_SELECT)
      .eq('status', 'waitlisted')
      .gte('booking_date', today)
      .order('booking_date')
      .order('start_time')
      .order('created_at')
      .limit(200),
    supabase
      .from('room_bookings')
      .select('room_id, booking_date, status')
      .in('status', ['confirmed', 'waitlisted'])
      .gte('booking_date', today),
  ])

  const waiting = ((waitRows.data ?? []) as unknown as BookingRow[]).map((r) => mapBooking(r, true))
  const roomName = new Map(rooms.map((r) => [r.id, r.name]))

  let blockersAll: CalendarBooking[] = []
  if (waiting.length) {
    const dates = Array.from(new Set(waiting.map((w) => w.booking_date)))
    const { data } = await supabase
      .from('room_bookings')
      .select(BOOKING_ADMIN_SELECT)
      .eq('status', 'confirmed')
      .in('booking_date', dates)
    blockersAll = ((data ?? []) as unknown as BookingRow[]).map((r) => mapBooking(r, true))
  }

  const waitlist: WaitlistEntry[] = waiting.map((w) => {
    const sameSlot = (b: CalendarBooking) =>
      b.room_id === w.room_id && b.booking_date === w.booking_date && timesOverlap(b.start_time, b.end_time, w.start_time, w.end_time)
    const ahead = waiting.filter(
      (o) => o.id !== w.id && sameSlot(o) && (o.created_at < w.created_at || (o.created_at === w.created_at && o.id < w.id))
    ).length
    return {
      booking: w,
      room_name: roomName.get(w.room_id) ?? '-',
      position: ahead + 1,
      blockers: blockersAll.filter(sameSlot),
    }
  })

  const upcomingRows = upcoming.data ?? []
  const counts = new Map<number, number>()
  for (const b of upcomingRows) counts.set(b.room_id, (counts.get(b.room_id) ?? 0) + 1)

  return {
    today,
    rooms: rooms.map((r) => ({ ...r, upcoming_count: counts.get(r.id) ?? 0 })),
    waitlist,
    todayCount: upcomingRows.filter((b) => b.booking_date === today && b.status === 'confirmed').length,
  }
}

/** Waiting bookings that overlap a given booking's slot, next in line first. */
export async function getSlotCandidates(bookingId: number): Promise<
  { booking: CalendarBooking; otherBlockers: number }[]
> {
  try {
    await requireAdmin()
  } catch {
    return []
  }
  const supabase = createServiceRoleClient()
  const { data: target } = await supabase
    .from('room_bookings')
    .select('id, room_id, booking_date, start_time, end_time')
    .eq('id', bookingId)
    .maybeSingle()
  if (!target) return []

  const sameDay = await fetchBookings(supabase, {
    from: target.booking_date,
    to: target.booking_date,
    roomId: target.room_id,
    admin: true,
  })
  const tStart = shortTime(target.start_time)
  const tEnd = shortTime(target.end_time)
  const confirmed = sameDay.filter((b) => b.status === 'confirmed' && b.id !== target.id)

  return sameDay
    .filter((b) => b.status === 'waitlisted' && b.id !== target.id && timesOverlap(b.start_time, b.end_time, tStart, tEnd))
    .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id - b.id))
    .map((b) => ({
      booking: b,
      otherBlockers: confirmed.filter((c) => timesOverlap(c.start_time, c.end_time, b.start_time, b.end_time)).length,
    }))
}

// ─── Cancel and promote ───────────────────────────────────────────────────────

interface EmailBookingRow {
  id: number
  booking_date: string
  start_time: string
  end_time: string
  status: CalendarBooking['status']
  rooms: { name: string } | null
  room_reservations: ReservationRow & { manage_token: string }
}

async function loadForEmail(bookingId: number): Promise<EmailBookingRow | null> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('room_bookings')
    .select(`id, booking_date, start_time, end_time, status, rooms(name), room_reservations!inner(${RESERVATION_FULL_FIELDS})`)
    .eq('id', bookingId)
    .maybeSingle()
  return data as unknown as EmailBookingRow | null
}

export async function adminCancelBooking(params: {
  bookingId: number
  scope?: 'one' | 'upcoming'
  reason?: string
  notify?: boolean
  promoteId?: number | null
}): Promise<{ error?: string; cancelled: number; promoted?: boolean; promoteError?: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Akses admin diperlukan', cancelled: 0 }
  }
  const supabase = createServiceRoleClient()
  const reason = params.reason?.trim() || null

  const { data: target } = await supabase
    .from('room_bookings')
    .select('id, reservation_id, booking_date')
    .eq('id', params.bookingId)
    .maybeSingle()
  if (!target) return { error: 'Booking tidak ditemukan', cancelled: 0 }

  let query = supabase
    .from('room_bookings')
    .update({
      status: 'cancelled',
      cancelled_by: 'admin',
      cancel_reason: reason,
      status_changed_at: new Date().toISOString(),
    })
    .neq('status', 'cancelled')
  query =
    params.scope === 'upcoming'
      ? query.eq('reservation_id', target.reservation_id).gte('booking_date', target.booking_date)
      : query.eq('id', target.id)

  const { data: rows, error } = await query.select('id')
  if (error) {
    console.error('[rooms] admin cancel failed:', error)
    return { error: 'Pembatalan gagal', cancelled: 0 }
  }
  const cancelledIds = (rows ?? []).map((r) => r.id)

  if (params.notify && cancelledIds.length) {
    after(async () => {
      for (const id of cancelledIds.slice(0, 20)) {
        const b = await loadForEmail(id)
        if (!b) continue
        await sendRoomStatusEmail({
          kind: 'cancelled',
          reservation: toEmailReservation(b.room_reservations, b.booking_date),
          roomName: b.rooms?.name ?? 'Ruangan',
          booking: { ...b, status: 'cancelled' },
          token: b.room_reservations.manage_token,
          reason,
        })
      }
    })
  }

  let promoted: boolean | undefined
  let promoteError: string | undefined
  if (params.promoteId) {
    const res = await adminPromoteBooking(params.promoteId)
    promoted = !res.error
    promoteError = res.error
  }

  refresh()
  return { cancelled: cancelledIds.length, promoted, promoteError }
}

export async function adminPromoteBooking(bookingId: number, notify = true): Promise<{ error?: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Akses admin diperlukan' }
  }
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('room_bookings')
    .update({ status: 'confirmed', status_changed_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('status', 'waitlisted')
    .select('id')

  if (error) {
    if (error.code === '23P01') {
      return { error: 'Masih bentrok dengan booking terkonfirmasi lain. Batalkan booking itu dulu.' }
    }
    console.error('[rooms] promote failed:', error)
    return { error: 'Konfirmasi gagal' }
  }
  if (!data?.length) return { error: 'Booking ini tidak ada di daftar tunggu' }

  if (notify) {
    after(async () => {
      const b = await loadForEmail(bookingId)
      if (!b) return
      await sendRoomStatusEmail({
        kind: 'promoted',
        reservation: toEmailReservation(b.room_reservations, b.booking_date),
        roomName: b.rooms?.name ?? 'Ruangan',
        booking: { ...b, status: 'confirmed' },
        token: b.room_reservations.manage_token,
      })
    })
  }

  refresh()
  return {}
}

// ─── Edit room, date or time ──────────────────────────────────────────────────

export interface MoveInput {
  bookingId: number
  roomId: number
  /** new date; only used when scope is 'one' */
  date: string
  startTime: string
  endTime: string
  /** 'upcoming' moves this date and every later date of the series to the new room and time */
  scope: 'one' | 'upcoming'
}

export interface MoveConflict {
  booking_date: string
  start_time: string
  end_time: string
  agenda: string
  borrower_name: string
  department: string
}

interface MoveRow {
  id: number
  booking_date: string
  status: CalendarBooking['status']
}

type MovePlan =
  | { error: string }
  | { error?: undefined; rows: MoveRow[]; conflicts: MoveConflict[]; roomName: string; start: string; end: string }

/** Works out which rows move where, and which confirmed bookings they would clash with. */
async function planMove(input: MoveInput): Promise<MovePlan> {
  const supabase = createServiceRoleClient()
  if (!isTimeString(input.startTime) || !isTimeString(input.endTime)) return { error: 'Pilih jam mulai dan selesai' }
  const start = shortTime(input.startTime)
  const end = shortTime(input.endTime)
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  if (e <= s) return { error: 'Jam selesai harus setelah jam mulai' }
  if (s < timeToMinutes(ROOM_DAY_START) || e > timeToMinutes(ROOM_DAY_END)) {
    return { error: `Jam booking ${ROOM_DAY_START}–${ROOM_DAY_END}` }
  }
  if (s % ROOM_SLOT_MINUTES || e % ROOM_SLOT_MINUTES) return { error: `Jam harus kelipatan ${ROOM_SLOT_MINUTES} menit` }

  const { data: room } = await supabase
    .from('rooms')
    .select('id, name, status')
    .eq('id', input.roomId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!room) return { error: 'Ruangan tidak ditemukan' }
  if (room.status !== 'available') return { error: `${room.name} sedang dalam perbaikan` }

  const { data: target } = await supabase
    .from('room_bookings')
    .select('id, reservation_id, booking_date, status')
    .eq('id', input.bookingId)
    .maybeSingle()
  if (!target) return { error: 'Booking tidak ditemukan' }
  if (target.status === 'cancelled') return { error: 'Booking sudah dibatalkan' }

  let rows: MoveRow[]
  if (input.scope === 'upcoming') {
    const { data } = await supabase
      .from('room_bookings')
      .select('id, booking_date, status')
      .eq('reservation_id', target.reservation_id)
      .neq('status', 'cancelled')
      .gte('booking_date', target.booking_date)
      .order('booking_date')
    rows = (data ?? []) as MoveRow[]
  } else {
    if (!isDateString(input.date)) return { error: 'Pilih tanggal' }
    rows = [{ id: target.id, booking_date: input.date, status: target.status }]
  }
  if (!rows.length) return { error: 'Tidak ada tanggal yang diubah' }

  // Confirmed bookings in the new room on those dates, other than the rows being moved
  const movingIds = new Set(rows.map((r) => r.id))
  const dates = Array.from(new Set(rows.map((r) => r.booking_date)))
  const { data: others } = await supabase
    .from('room_bookings')
    .select(BOOKING_ADMIN_SELECT)
    .eq('room_id', input.roomId)
    .eq('status', 'confirmed')
    .in('booking_date', dates)
  const conflicts = ((others ?? []) as unknown as BookingRow[])
    .map((r) => mapBooking(r, false))
    .filter((b) => !movingIds.has(b.id) && timesOverlap(b.start_time, b.end_time, start, end))
    .map((b) => ({
      booking_date: b.booking_date,
      start_time: b.start_time,
      end_time: b.end_time,
      agenda: b.agenda,
      borrower_name: b.borrower_name,
      department: b.department,
    }))

  return { rows, conflicts, roomName: room.name, start, end }
}

/** Live check for the edit form: how many dates move, and what they would clash with. */
export async function adminPreviewMove(input: MoveInput): Promise<{ error?: string; count: number; conflicts: MoveConflict[] }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Akses admin diperlukan', count: 0, conflicts: [] }
  }
  const plan = await planMove(input)
  if (plan.error !== undefined) return { error: plan.error, count: 0, conflicts: [] }
  return { count: plan.rows.length, conflicts: plan.conflicts }
}

/**
 * Moves one date (or this and later dates) to a new room, date or time.
 * A confirmed date that would overlap another confirmed booking is refused,
 * unless allowWaitlist is set: then it is saved on the waiting list instead.
 */
export async function adminUpdateBooking(
  input: MoveInput & { allowWaitlist?: boolean; notify?: boolean }
): Promise<{ error?: string; conflicts?: MoveConflict[]; updated: number; waitlisted: number }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Akses admin diperlukan', updated: 0, waitlisted: 0 }
  }
  const plan = await planMove(input)
  if (plan.error !== undefined) return { error: plan.error, updated: 0, waitlisted: 0 }
  if (plan.conflicts.length && !input.allowWaitlist) {
    return { error: 'Jadwal baru bentrok dengan booking lain', conflicts: plan.conflicts, updated: 0, waitlisted: 0 }
  }

  const supabase = createServiceRoleClient()
  let updated = 0
  let waitlisted = 0
  for (const row of plan.rows) {
    const change = {
      room_id: input.roomId,
      booking_date: row.booking_date,
      start_time: plan.start,
      end_time: plan.end,
    }
    let { error } = await supabase.from('room_bookings').update(change).eq('id', row.id)
    if (error?.code === '23P01' && input.allowWaitlist) {
      // Someone else holds the new slot: keep the change, wait in line behind them
      ;({ error } = await supabase
        .from('room_bookings')
        .update({ ...change, status: 'waitlisted', status_changed_at: new Date().toISOString() })
        .eq('id', row.id))
      if (!error) waitlisted++
    }
    if (error) {
      console.error('[rooms] admin update failed:', error)
      refresh()
      return {
        error: error.code === '23P01' ? 'Jadwal baru bentrok dengan booking lain' : 'Perubahan gagal disimpan',
        updated,
        waitlisted,
      }
    }
    updated++
  }

  if (input.notify && updated) {
    const ids = plan.rows.map((r) => r.id)
    after(async () => {
      const b = await loadForEmail(ids[0])
      if (!b) return
      await sendRoomStatusEmail({
        kind: 'changed',
        reservation: toEmailReservation(b.room_reservations, b.booking_date),
        roomName: b.rooms?.name ?? plan.roomName,
        booking: b,
        token: b.room_reservations.manage_token,
        changedCount: ids.length,
      })
    })
  }

  refresh()
  return { updated, waitlisted }
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

/** Upcoming confirmed or waiting bookings per room, from today on. */
async function upcomingCounts(): Promise<Map<number, number>> {
  const { data } = await createServiceRoleClient()
    .from('room_bookings')
    .select('room_id')
    .in('status', ['confirmed', 'waitlisted'])
    .gte('booking_date', todayJakarta())
  const counts = new Map<number, number>()
  for (const b of data ?? []) counts.set(b.room_id, (counts.get(b.room_id) ?? 0) + 1)
  return counts
}

/** All rooms (including ones under maintenance) for the Kelola Ruangan page. */
export async function getAdminRooms(): Promise<AdminRoom[]> {
  await requireAdmin()
  const [rooms, counts] = await Promise.all([fetchRooms(createServiceRoleClient(), { includeMaintenance: true }), upcomingCounts()])
  return rooms.map((r) => ({ ...r, upcoming_count: counts.get(r.id) ?? 0 }))
}

export async function getAdminRoom(id: number): Promise<AdminRoom | null> {
  const rooms = await getAdminRooms()
  return rooms.find((r) => r.id === id) ?? null
}

export interface RoomInput {
  id?: number
  name: string
  area?: string
  max_people?: number | null
  facilities?: string
  status: RoomStatus
  sort_order?: number
}

export async function saveRoom(input: RoomInput): Promise<{ error?: string; id?: number }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Akses admin diperlukan' }
  }
  const name = input.name?.trim()
  if (!name) return { error: 'Nama ruangan harus diisi' }
  const maxPeople = input.max_people ? Math.floor(Number(input.max_people)) : null
  if (maxPeople !== null && (!Number.isFinite(maxPeople) || maxPeople < 1)) return { error: 'Kapasitas tidak valid' }
  if (input.status !== 'available' && input.status !== 'maintenance') return { error: 'Status tidak valid' }

  const row = {
    name,
    area: input.area?.trim() || null,
    max_people: maxPeople,
    facilities: input.facilities?.trim() || null,
    status: input.status,
    sort_order: Number.isFinite(Number(input.sort_order)) ? Number(input.sort_order) : 0,
  }
  const supabase = createServiceRoleClient()
  const { data, error } = input.id
    ? await supabase.from('rooms').update(row).eq('id', input.id).select('id').single()
    : await supabase.from('rooms').insert(row).select('id').single()

  if (error || !data) {
    console.error('[rooms] save failed:', error)
    return { error: 'Ruangan gagal disimpan' }
  }
  refresh()
  return { id: data.id }
}

export async function deleteRoom(id: number): Promise<{ error?: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Akses admin diperlukan' }
  }
  const supabase = createServiceRoleClient()
  const { count } = await supabase
    .from('room_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', id)
    .in('status', ['confirmed', 'waitlisted'])
    .gte('booking_date', todayJakarta())
  if (count) return { error: `Masih ada ${count} booking mendatang. Batalkan dulu atau set status perbaikan.` }

  // Soft delete keeps past bookings readable
  const { error } = await supabase.from('rooms').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Ruangan gagal dihapus' }
  refresh()
  return {}
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
// Server actions accept 1 MB bodies by default; the admin form resizes photos before upload
const MAX_IMAGE_BYTES = 950 * 1024

export async function uploadRoomImage(formData: FormData): Promise<{ error?: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Akses admin diperlukan' }
  }
  const roomId = Number(formData.get('roomId'))
  const file = formData.get('file')
  if (!Number.isInteger(roomId) || !(file instanceof File)) return { error: 'Data tidak lengkap' }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { error: 'Gunakan JPG, PNG, atau WebP' }
  if (file.size > MAX_IMAGE_BYTES) return { error: 'Foto terlalu besar setelah dikompres (maks 950 KB)' }

  const supabase = createServiceRoleClient()
  const { count } = await supabase
    .from('room_images')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
  if ((count ?? 0) >= MAX_ROOM_IMAGES) return { error: `Maksimal ${MAX_ROOM_IMAGES} foto per ruangan` }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${roomId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error: upErr } = await supabase.storage.from(ROOM_IMAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
  })
  if (upErr) {
    console.error('[rooms] image upload failed:', upErr)
    return { error: 'Upload gagal' }
  }
  const { data: pub } = supabase.storage.from(ROOM_IMAGE_BUCKET).getPublicUrl(path)
  const { error } = await supabase.from('room_images').insert({
    room_id: roomId,
    storage_path: path,
    public_url: pub.publicUrl,
    display_order: count ?? 0,
  })
  if (error) {
    await supabase.storage.from(ROOM_IMAGE_BUCKET).remove([path])
    return { error: 'Foto gagal disimpan' }
  }
  refresh()
  return {}
}

export async function deleteRoomImage(imageId: number): Promise<{ error?: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Akses admin diperlukan' }
  }
  const supabase = createServiceRoleClient()
  const { data } = await supabase.from('room_images').select('storage_path').eq('id', imageId).maybeSingle()
  if (!data) return { error: 'Foto tidak ditemukan' }
  await supabase.storage.from(ROOM_IMAGE_BUCKET).remove([data.storage_path])
  await supabase.from('room_images').delete().eq('id', imageId)
  refresh()
  return {}
}
