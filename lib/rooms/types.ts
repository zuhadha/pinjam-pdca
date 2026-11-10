import type { RecurrenceType } from './recurrence'

export type RoomStatus = 'available' | 'maintenance'
export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled'
export type CalendarView = 'day' | 'week' | 'month'

export interface RoomImage {
  id: number
  public_url: string
  storage_path: string
  display_order: number
}

export interface Room {
  id: number
  name: string
  area: string | null
  max_people: number | null
  facilities: string | null
  status: RoomStatus
  sort_order: number
  images: RoomImage[]
}

/** A booking as the calendar draws it. Contact fields are only filled for admins. */
export interface CalendarBooking {
  id: number
  reservation_id: number
  room_id: number
  booking_date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time: string // HH:MM
  status: BookingStatus
  created_at: string
  borrower_name: string
  department: string
  agenda: string
  people_count: number | null
  recurrence_type: RecurrenceType
  // admin only
  phone_number?: string
  email?: string | null
  participants?: string | null
  notes?: string | null
  manage_token?: string
}

export interface ReservationInput {
  roomId: number
  date: string
  startTime: string
  endTime: string
  recurrence: {
    type: RecurrenceType
    weekdays?: number[]
    skipWeekends?: boolean
    endType?: 'until' | 'count'
    until?: string
    count?: number
  }
  borrowerName: string
  department: string
  phoneNumber: string
  email: string
  agenda: string
  participants?: string
  peopleCount?: number | null
  notes?: string
}

export interface SlotCheck {
  date: string
  status: 'free' | 'waitlist' | 'past'
  /** confirmed bookings this date would wait behind */
  conflicts: { start_time: string; end_time: string; agenda: string; department: string }[]
}

/** Everything needed to book the same thing again, except the date. */
export interface RebookDetails {
  roomId: number
  startTime: string
  endTime: string
  borrowerName: string
  department: string
  phoneNumber: string
  email: string | null
  agenda: string
  participants: string | null
  peopleCount: number | null
  notes: string | null
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly'
    weekdays?: number[]
    skipWeekends?: boolean
    count?: number
  }
}
