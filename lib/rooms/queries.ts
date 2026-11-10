/**
 * Database reads shared by public and admin room actions.
 * Plain server module: import only from 'use server' files or server components.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { describeRecurrence, type RecurrenceType } from './recurrence'
import { shortTime } from './dates'
import type { BookingStatus, CalendarBooking, Room, RoomImage, RoomStatus } from './types'
import type { RoomEmailReservation } from '@/lib/email/room-email'

// Row shapes as PostgREST returns them (the client is not generated from the schema)
interface RoomRow {
  id: number
  name: string
  area: string | null
  max_people: number | null
  facilities: string | null
  status: RoomStatus
  sort_order: number
  room_images: RoomImage[] | null
}

interface ReservationJoin {
  borrower_name: string
  department: string
  agenda: string
  people_count: number | null
  recurrence_type: RecurrenceType
  phone_number?: string
  email?: string | null
  participants?: string | null
  notes?: string | null
  manage_token?: string
}

export interface BookingRow {
  id: number
  reservation_id: number
  room_id: number
  booking_date: string
  start_time: string
  end_time: string
  status: BookingStatus
  created_at: string
  room_reservations: ReservationJoin | null
}

/** Row selected with RESERVATION_FULL_FIELDS */
export interface ReservationRow {
  id?: number
  borrower_name: string
  department: string
  phone_number: string
  email: string | null
  agenda: string
  participants?: string | null
  people_count: number | null
  notes?: string | null
  recurrence_type: RecurrenceType
  recurrence_weekdays?: number[] | null
  recurrence_skip_weekends?: boolean | null
  recurrence_until?: string | null
  recurrence_count?: number | null
  manage_token?: string
  created_at?: string
}

const PUBLIC_RESERVATION_FIELDS = 'borrower_name, department, agenda, people_count, recurrence_type'
const ADMIN_RESERVATION_FIELDS = `${PUBLIC_RESERVATION_FIELDS}, phone_number, email, participants, notes, manage_token`

export const RESERVATION_FULL_FIELDS =
  'id, borrower_name, department, phone_number, email, agenda, participants, people_count, notes, recurrence_type, recurrence_weekdays, recurrence_skip_weekends, recurrence_until, recurrence_count, manage_token, created_at'

export async function fetchRooms(supabase: SupabaseClient, opts: { includeMaintenance?: boolean } = {}): Promise<Room[]> {
  let query = supabase
    .from('rooms')
    .select('id, name, area, max_people, facilities, status, sort_order, room_images(id, public_url, storage_path, display_order)')
    .is('deleted_at', null)
    .order('sort_order')
    .order('name')
  if (!opts.includeMaintenance) query = query.eq('status', 'available')

  const { data, error } = await query
  if (error) {
    console.error('[rooms] fetchRooms failed:', error)
    return []
  }
  return ((data ?? []) as RoomRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    area: r.area,
    max_people: r.max_people,
    facilities: r.facilities,
    status: r.status,
    sort_order: r.sort_order,
    images: [...(r.room_images ?? [])].sort((a, b) => a.display_order - b.display_order),
  }))
}

export function mapBooking(row: BookingRow, admin: boolean): CalendarBooking {
  const r: Partial<ReservationJoin> = row.room_reservations ?? {}
  const booking: CalendarBooking = {
    id: row.id,
    reservation_id: row.reservation_id,
    room_id: row.room_id,
    booking_date: row.booking_date,
    start_time: shortTime(row.start_time),
    end_time: shortTime(row.end_time),
    status: row.status,
    created_at: row.created_at,
    borrower_name: r.borrower_name ?? '-',
    department: r.department ?? '-',
    agenda: r.agenda ?? '-',
    people_count: r.people_count ?? null,
    recurrence_type: r.recurrence_type ?? 'none',
  }
  if (admin) {
    booking.phone_number = r.phone_number
    booking.email = r.email
    booking.participants = r.participants
    booking.notes = r.notes
    booking.manage_token = r.manage_token
  }
  return booking
}

export async function fetchBookings(
  supabase: SupabaseClient,
  opts: {
    from: string
    to: string
    roomId?: number | null
    statuses?: CalendarBooking['status'][]
    admin?: boolean
  }
): Promise<CalendarBooking[]> {
  const admin = !!opts.admin
  let query = supabase
    .from('room_bookings')
    .select(
      `id, reservation_id, room_id, booking_date, start_time, end_time, status, created_at,
       room_reservations!inner(${admin ? ADMIN_RESERVATION_FIELDS : PUBLIC_RESERVATION_FIELDS})`
    )
    .gte('booking_date', opts.from)
    .lte('booking_date', opts.to)
    .in('status', opts.statuses ?? ['confirmed', 'waitlisted'])
    .order('booking_date')
    .order('start_time')
    .order('created_at')
  if (opts.roomId) query = query.eq('room_id', opts.roomId)

  const { data, error } = await query
  if (error) {
    console.error('[rooms] fetchBookings failed:', error)
    return []
  }
  return ((data ?? []) as unknown as BookingRow[]).map((row) => mapBooking(row, admin))
}

/** Reservation row (from RESERVATION_FULL_FIELDS) to the shape the email module needs. */
export function toEmailReservation(r: ReservationRow, firstDate: string): RoomEmailReservation {
  return {
    borrower_name: r.borrower_name,
    department: r.department,
    phone_number: r.phone_number,
    email: r.email,
    agenda: r.agenda,
    people_count: r.people_count,
    recurrence_summary: describeRecurrence(
      {
        type: r.recurrence_type as RecurrenceType,
        weekdays: r.recurrence_weekdays ?? undefined,
        skipWeekends: r.recurrence_skip_weekends ?? undefined,
        endType: r.recurrence_count ? 'count' : 'until',
        until: r.recurrence_until ?? undefined,
        count: r.recurrence_count ?? undefined,
      },
      firstDate
    ),
  }
}
