'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAdminNotificationEmails } from '@/lib/actions/settings-actions'
import { generateSecureToken } from '@/lib/utils/token-utils'
import { ROOM_DAY_END, ROOM_DAY_START, ROOM_SLOT_MINUTES } from '@/lib/rooms/constants'
import {
  addDays,
  isDateString,
  isTimeString,
  nowTimeJakarta,
  shortTime,
  timeToMinutes,
  timesOverlap,
  todayJakarta,
} from '@/lib/rooms/dates'
import { expandDates, normaliseWeekdays, type RecurrenceRule } from '@/lib/rooms/recurrence'
import {
  RESERVATION_FULL_FIELDS,
  fetchBookings,
  fetchRooms,
  toEmailReservation,
  type ReservationRow,
} from '@/lib/rooms/queries'
import { sendAdminBorrowerCancelledEmail, sendRoomSubmittedEmails } from '@/lib/email/room-email'
import type { CalendarBooking, RebookDetails, ReservationInput, Room, SlotCheck } from '@/lib/rooms/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_RE = /^[a-f0-9]{64}$/

async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'admin' ? user : null
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/** Rooms for public pages. Rooms under maintenance are listed but cannot be booked. */
export async function getPublicRooms(opts: { includeMaintenance?: boolean } = {}): Promise<Room[]> {
  return fetchRooms(createServiceRoleClient(), opts)
}

/** Calendar data. Contact details are included only for admins. */
export async function getCalendarBookings(params: {
  from: string
  to: string
  roomId?: number | null
}): Promise<CalendarBooking[]> {
  if (!isDateString(params.from) || !isDateString(params.to) || params.from > params.to) return []
  const admin = !!(await isAdmin())
  return fetchBookings(createServiceRoleClient(), { ...params, admin })
}

// ─── All dates of one reservation (calendar popup) ───────────────────────────

/** Every active date of a reservation, so a repeating booking shows as one agenda. */
export async function getReservationDates(
  reservationId: number
): Promise<{ date: string; status: CalendarBooking['status'] }[]> {
  if (!Number.isInteger(reservationId)) return []
  const { data } = await createServiceRoleClient()
    .from('room_bookings')
    .select('booking_date, status')
    .eq('reservation_id', reservationId)
    .neq('status', 'cancelled')
    .order('booking_date')
    .limit(200)
  return (data ?? []).map((r) => ({ date: r.booking_date, status: r.status }))
}

// ─── Rebook ───────────────────────────────────────────────────────────────────

interface RebookRow {
  room_id: number
  start_time: string
  end_time: string
  room_reservations: ReservationRow | null
}

/** Details of an existing booking, to fill the booking form again with a new date. */
export async function getRebookDetails(bookingId: number): Promise<RebookDetails | null> {
  if (!Number.isInteger(bookingId)) return null
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('room_bookings')
    .select(`room_id, start_time, end_time, room_reservations!inner(${RESERVATION_FULL_FIELDS})`)
    .eq('id', bookingId)
    .maybeSingle()
  const row = data as unknown as RebookRow | null
  const r = row?.room_reservations
  if (!row || !r) return null
  return {
    roomId: row.room_id,
    startTime: shortTime(row.start_time),
    endTime: shortTime(row.end_time),
    borrowerName: r.borrower_name,
    department: r.department,
    phoneNumber: r.phone_number === '-' ? '' : r.phone_number,
    email: r.email,
    agenda: r.agenda,
    participants: r.participants ?? null,
    peopleCount: r.people_count,
    notes: r.notes ?? null,
    recurrence: {
      type: r.recurrence_type,
      weekdays: r.recurrence_weekdays ?? undefined,
      skipWeekends: r.recurrence_skip_weekends ?? undefined,
      count: r.recurrence_count ?? undefined,
    },
  }
}

// ─── Agenda lookup for the item borrow form ──────────────────────────────────

export interface RoomAgendaOption {
  id: number
  booking_date: string
  start_time: string
  end_time: string
  room_id: number
  room_name: string
  agenda: string
  department: string
  borrower_name: string
  email: string | null
}

interface AgendaRow {
  id: number
  room_id: number
  booking_date: string
  start_time: string
  end_time: string
  rooms: { name: string } | null
  room_reservations: { agenda: string; department: string; borrower_name: string; email: string | null } | null
}

const AGENDA_LOOKAHEAD_DAYS = 60

/**
 * Confirmed room bookings to copy into an item borrow request.
 * Without a date it lists the next 60 days. Returns the booker's name, email and
 * department so the borrow form can copy them (phone numbers stay private).
 */
export async function searchRoomAgendas(params: {
  q?: string
  date?: string | null
  roomId?: number | null
}): Promise<RoomAgendaOption[]> {
  const supabase = createServiceRoleClient()
  const today = todayJakarta()
  let query = supabase
    .from('room_bookings')
    .select(
      'id, room_id, booking_date, start_time, end_time, rooms(name), room_reservations!inner(agenda, department, borrower_name, email)'
    )
    .eq('status', 'confirmed')
    .order('booking_date')
    .order('start_time')
    .limit(30)

  if (isDateString(params.date)) {
    query = query.eq('booking_date', params.date)
  } else {
    query = query.gte('booking_date', today).lte('booking_date', addDays(today, AGENDA_LOOKAHEAD_DAYS))
  }
  if (params.roomId) query = query.eq('room_id', params.roomId)
  // Strip LIKE wildcards so typed text matches literally
  const q = params.q?.replace(/[%_\\]/g, '').trim().slice(0, 80)
  if (q) query = query.ilike('room_reservations.agenda', `%${q}%`)

  const { data, error } = await query
  if (error) {
    console.error('[rooms] searchRoomAgendas failed:', error)
    return []
  }
  return ((data ?? []) as unknown as AgendaRow[]).map((b) => ({
    id: b.id,
    booking_date: b.booking_date,
    start_time: shortTime(b.start_time),
    end_time: shortTime(b.end_time),
    room_id: b.room_id,
    room_name: b.rooms?.name ?? '-',
    agenda: b.room_reservations?.agenda ?? '-',
    department: b.room_reservations?.department ?? '-',
    borrower_name: b.room_reservations?.borrower_name ?? '-',
    email: b.room_reservations?.email ?? null,
  }))
}

// ─── Validation shared by the live check and the submit ──────────────────────

type SlotPlan =
  | { error: string }
  | { error?: undefined; room: Room; dates: string[]; startTime: string; endTime: string; rule: RecurrenceRule }

async function planSlots(
  input: Pick<ReservationInput, 'roomId' | 'date' | 'startTime' | 'endTime' | 'recurrence'>,
  admin: boolean
): Promise<SlotPlan> {
  const supabase = createServiceRoleClient()

  if (!isDateString(input.date)) return { error: 'Pilih tanggal' }
  if (!isTimeString(input.startTime) || !isTimeString(input.endTime)) return { error: 'Pilih jam mulai dan selesai' }

  const startTime = shortTime(input.startTime)
  const endTime = shortTime(input.endTime)
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  if (end <= start) return { error: 'Jam selesai harus setelah jam mulai' }
  if (start < timeToMinutes(ROOM_DAY_START) || end > timeToMinutes(ROOM_DAY_END)) {
    return { error: `Ruangan bisa dibooking ${ROOM_DAY_START}–${ROOM_DAY_END}` }
  }
  if (start % ROOM_SLOT_MINUTES || end % ROOM_SLOT_MINUTES) {
    return { error: `Jam harus kelipatan ${ROOM_SLOT_MINUTES} menit` }
  }

  const today = todayJakarta()
  if (!admin) {
    if (input.date < today) return { error: 'Tanggal tidak boleh sebelum hari ini' }
    if (input.date === today && startTime <= nowTimeJakarta()) return { error: 'Jam mulai hari ini sudah lewat' }
  }

  const rule: RecurrenceRule = {
    type: input.recurrence?.type ?? 'none',
    weekdays: input.recurrence?.weekdays,
    skipWeekends: !!input.recurrence?.skipWeekends,
    endType: input.recurrence?.endType === 'count' ? 'count' : 'until',
    until: input.recurrence?.until,
    count: input.recurrence?.count,
  }
  if (rule.type === 'weekly') rule.weekdays = normaliseWeekdays(rule.weekdays, input.date)
  const expanded = expandDates(input.date, rule)
  if (expanded.error) return { error: expanded.error }

  const { data: room, error } = await supabase
    .from('rooms')
    .select('id, name, area, max_people, facilities, status, sort_order')
    .eq('id', input.roomId)
    .is('deleted_at', null)
    .maybeSingle()
  if (error || !room) return { error: 'Ruangan tidak ditemukan' }
  if (room.status !== 'available') return { error: `${room.name} sedang dalam perbaikan` }

  return { room: { ...room, images: [] } as Room, dates: expanded.dates, startTime, endTime, rule }
}

/**
 * Live availability for the booking form: for each date, is the room free,
 * or would this booking go to the waiting list (and behind which booking)?
 */
export async function checkRoomSlots(
  input: Pick<ReservationInput, 'roomId' | 'date' | 'startTime' | 'endTime' | 'recurrence'>
): Promise<{ error?: string; slots: SlotCheck[] }> {
  const admin = !!(await isAdmin())
  const plan = await planSlots(input, admin)
  if (plan.error !== undefined) return { error: plan.error, slots: [] }

  const confirmed = await fetchBookings(createServiceRoleClient(), {
    from: plan.dates[0],
    to: plan.dates[plan.dates.length - 1],
    roomId: plan.room.id,
    statuses: ['confirmed'],
  })
  const byDate = new Map<string, CalendarBooking[]>()
  for (const b of confirmed) byDate.set(b.booking_date, [...(byDate.get(b.booking_date) ?? []), b])

  const slots: SlotCheck[] = plan.dates.map((date) => {
    const conflicts = (byDate.get(date) ?? [])
      .filter((b) => timesOverlap(b.start_time, b.end_time, plan.startTime, plan.endTime))
      .map((b) => ({ start_time: b.start_time, end_time: b.end_time, agenda: b.agenda, department: b.department }))
    return { date, status: conflicts.length ? 'waitlist' : 'free', conflicts }
  })
  return { slots }
}

// ─── Submit ───────────────────────────────────────────────────────────────────

export async function createRoomReservation(input: ReservationInput): Promise<
  | { error: string }
  | { error?: undefined; token: string; confirmed: number; waitlisted: number }
> {
  const admin = await isAdmin()

  const name = input.borrowerName?.trim()
  const department = input.department?.trim()
  const phone = input.phoneNumber?.replace(/[\s-]/g, '')
  const email = input.email?.trim().toLowerCase()
  const agenda = input.agenda?.trim()
  if (!name) return { error: 'Nama harus diisi' }
  if (!department) return { error: 'Departemen harus diisi' }
  if (!phone || !/^\+?\d{10,15}$/.test(phone)) return { error: 'Nomor telepon 10–15 digit' }
  if (!email || !EMAIL_RE.test(email)) return { error: 'Format email tidak valid' }
  if (!agenda) return { error: 'Agenda harus diisi' }
  const peopleCount = input.peopleCount ? Math.floor(Number(input.peopleCount)) : null
  if (peopleCount !== null && (!Number.isFinite(peopleCount) || peopleCount < 1)) {
    return { error: 'Jumlah peserta tidak valid' }
  }

  const plan = await planSlots(input, !!admin)
  if (plan.error !== undefined) return { error: plan.error }

  const token = generateSecureToken()
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('create_room_reservation', {
    p_reservation: {
      borrower_name: name,
      department,
      phone_number: phone,
      email,
      agenda,
      participants: input.participants?.trim() ?? '',
      people_count: peopleCount ?? '',
      notes: input.notes?.trim() ?? '',
      recurrence_type: plan.rule.type,
      recurrence_weekdays: plan.rule.type === 'weekly' ? plan.rule.weekdays : null,
      recurrence_skip_weekends: plan.rule.type === 'daily' && !!plan.rule.skipWeekends,
      recurrence_until: plan.rule.type !== 'none' && plan.rule.endType === 'until' ? plan.rule.until : '',
      recurrence_count: plan.rule.type !== 'none' && plan.rule.endType === 'count' ? plan.rule.count : '',
      manage_token: token,
      created_by: admin?.id ?? '',
    },
    p_slots: plan.dates.map((date) => ({
      room_id: plan.room.id,
      date,
      start: plan.startTime,
      end: plan.endTime,
    })),
  })

  if (error || !data) {
    console.error('[rooms] create_room_reservation failed:', error)
    return { error: 'Booking gagal disimpan. Coba lagi.' }
  }

  const rows = data as { booking_date: string; status: 'confirmed' | 'waitlisted' }[]
  const waitlisted = rows.filter((r) => r.status === 'waitlisted').length

  after(async () => {
    const adminEmails = await getAdminNotificationEmails()
    await sendRoomSubmittedEmails({
      reservation: toEmailReservation(
        {
          borrower_name: name,
          department,
          phone_number: phone,
          email,
          agenda,
          people_count: peopleCount,
          recurrence_type: plan.rule.type,
          recurrence_weekdays: plan.rule.weekdays,
          recurrence_skip_weekends: plan.rule.skipWeekends,
          recurrence_until: plan.rule.endType === 'until' ? plan.rule.until : null,
          recurrence_count: plan.rule.endType === 'count' ? plan.rule.count : null,
        },
        plan.dates[0]
      ),
      roomName: plan.room.name,
      bookings: rows.map((r) => ({
        booking_date: String(r.booking_date).slice(0, 10),
        start_time: plan.startTime,
        end_time: plan.endTime,
        status: r.status,
      })),
      token,
      adminEmails,
    })
  })

  revalidatePath('/rooms')
  revalidatePath('/admin')
  return { token, confirmed: rows.length - waitlisted, waitlisted }
}

// ─── Borrower's own booking page ──────────────────────────────────────────────

interface OwnBookingRow {
  id: number
  room_id: number
  booking_date: string
  start_time: string
  end_time: string
  status: CalendarBooking['status']
  cancelled_by: 'admin' | 'borrower' | null
  created_at: string
  rooms: { name: string } | null
}

type SlotRow = Pick<OwnBookingRow, 'id' | 'room_id' | 'booking_date' | 'start_time' | 'end_time' | 'created_at'>

export interface ManagedReservation {
  reservation: {
    id: number
    borrower_name: string
    department: string
    email: string | null
    agenda: string
    people_count: number | null
    participants: string | null
    notes: string | null
    recurrence_summary: string
    is_recurring: boolean
    created_at: string
  }
  bookings: {
    id: number
    room_id: number
    room_name: string
    booking_date: string
    start_time: string
    end_time: string
    status: CalendarBooking['status']
    cancelled_by: 'admin' | 'borrower' | null
    waitlist_position: number | null
  }[]
  today: string
}

export async function getReservationByToken(token: string): Promise<ManagedReservation | null> {
  if (!TOKEN_RE.test(token)) return null
  const supabase = createServiceRoleClient()

  const { data: reservationData } = await supabase
    .from('room_reservations')
    .select(RESERVATION_FULL_FIELDS)
    .eq('manage_token', token)
    .maybeSingle()
  const reservation = reservationData as (ReservationRow & { id: number; created_at: string }) | null
  if (!reservation) return null

  const { data: rows } = await supabase
    .from('room_bookings')
    .select('id, room_id, booking_date, start_time, end_time, status, cancelled_by, created_at, rooms(name)')
    .eq('reservation_id', reservation.id)
    .order('booking_date')
  const bookings = (rows ?? []) as unknown as OwnBookingRow[]

  // Waiting list position: confirmed-overlapping waitlisted bookings created earlier, same room and date
  const waiting = bookings.filter((b) => b.status === 'waitlisted')
  const positions = new Map<number, number>()
  if (waiting.length) {
    const dates = waiting.map((b) => b.booking_date)
    const { data: queue } = await supabase
      .from('room_bookings')
      .select('id, room_id, booking_date, start_time, end_time, created_at')
      .eq('status', 'waitlisted')
      .in('booking_date', dates)
    for (const b of waiting) {
      const ahead = ((queue ?? []) as SlotRow[]).filter(
        (q) =>
          q.room_id === b.room_id &&
          q.booking_date === b.booking_date &&
          timesOverlap(q.start_time, q.end_time, b.start_time, b.end_time) &&
          (q.created_at < b.created_at || (q.created_at === b.created_at && q.id < b.id))
      ).length
      positions.set(b.id, ahead + 1)
    }
  }

  const firstDate = bookings[0]?.booking_date ?? todayJakarta()
  return {
    reservation: {
      id: reservation.id,
      borrower_name: reservation.borrower_name,
      department: reservation.department,
      email: reservation.email,
      agenda: reservation.agenda,
      people_count: reservation.people_count,
      participants: reservation.participants ?? null,
      notes: reservation.notes ?? null,
      recurrence_summary: toEmailReservation(reservation, firstDate).recurrence_summary,
      is_recurring: reservation.recurrence_type !== 'none',
      created_at: reservation.created_at,
    },
    bookings: bookings.map((b) => ({
      id: b.id,
      room_id: b.room_id,
      room_name: b.rooms?.name ?? '-',
      booking_date: b.booking_date,
      start_time: shortTime(b.start_time),
      end_time: shortTime(b.end_time),
      status: b.status,
      cancelled_by: b.cancelled_by,
      waitlist_position: positions.get(b.id) ?? null,
    })),
    today: todayJakarta(),
  }
}

/** Borrower cancels some dates (or every upcoming date) of their own reservation. */
export async function cancelBookingsByToken(
  token: string,
  bookingIds: number[] | 'upcoming'
): Promise<{ error?: string; cancelled: number }> {
  if (!TOKEN_RE.test(token)) return { error: 'Link tidak valid', cancelled: 0 }
  const supabase = createServiceRoleClient()

  const { data: reservationData } = await supabase
    .from('room_reservations')
    .select(RESERVATION_FULL_FIELDS)
    .eq('manage_token', token)
    .maybeSingle()
  const reservation = reservationData as (ReservationRow & { id: number }) | null
  if (!reservation) return { error: 'Booking tidak ditemukan', cancelled: 0 }

  const today = todayJakarta()
  let targetQuery = supabase
    .from('room_bookings')
    .select('id, room_id, booking_date, start_time, end_time, status, rooms(name)')
    .eq('reservation_id', reservation.id)
    .neq('status', 'cancelled')
    .gte('booking_date', today)
  if (bookingIds !== 'upcoming') {
    const ids = bookingIds.filter((id) => Number.isInteger(id))
    if (!ids.length) return { error: 'Pilih tanggal yang dibatalkan', cancelled: 0 }
    targetQuery = targetQuery.in('id', ids)
  }
  const { data: targets } = await targetQuery
  const cancelled = (targets ?? []) as unknown as Omit<OwnBookingRow, 'cancelled_by' | 'created_at'>[]
  if (!cancelled.length) return { cancelled: 0 }

  const { error } = await supabase
    .from('room_bookings')
    .update({ status: 'cancelled', cancelled_by: 'borrower', status_changed_at: new Date().toISOString() })
    .in('id', cancelled.map((c) => c.id))
  if (error) {
    console.error('[rooms] borrower cancel failed:', error)
    return { error: 'Pembatalan gagal. Coba lagi.', cancelled: 0 }
  }
  // Only confirmed dates free a slot for the waiting list
  const freed = cancelled.filter((c) => c.status === 'confirmed')

  if (freed.length) {
    after(async () => {
      // Tell admins only when a freed slot has people waiting for it
      const dates = Array.from(new Set(freed.map((c) => c.booking_date)))
      const { data: waiting } = await supabase
        .from('room_bookings')
        .select('id, room_id, booking_date, start_time, end_time')
        .eq('status', 'waitlisted')
        .in('booking_date', dates)
      const waitingCount = ((waiting ?? []) as SlotRow[]).filter((w) =>
        freed.some(
          (c) =>
            c.room_id === w.room_id &&
            c.booking_date === w.booking_date &&
            timesOverlap(c.start_time, c.end_time, w.start_time, w.end_time)
        )
      ).length
      if (!waitingCount) return
      await sendAdminBorrowerCancelledEmail({
        reservation: toEmailReservation(reservation, freed[0].booking_date),
        roomName: freed[0].rooms?.name ?? 'Ruangan',
        bookings: freed.map((c) => ({
          booking_date: c.booking_date,
          start_time: c.start_time,
          end_time: c.end_time,
          status: 'cancelled' as const,
        })),
        waitingCount,
        adminEmails: await getAdminNotificationEmails(),
      })
    })
  }

  revalidatePath('/rooms')
  revalidatePath('/admin')
  revalidatePath(`/rooms/booking/${token}`)
  return { cancelled: cancelled.length }
}
