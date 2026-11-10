'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getCurrentUser } from '@/lib/auth/actions'
import { addDays, endOfMonth, shortTime, startOfMonth, startOfWeek, todayJakarta } from '@/lib/rooms/dates'

export interface RoomDashboardRow {
  /** booking date, YYYY-MM-DD */
  date: string
  start: string
  end: string
  roomId: number
  reservationId: number
  department: string
}

export interface RoomDashboardData {
  today: string
  rows: RoomDashboardRow[]
  rooms: { id: number; name: string; active: boolean }[]
  /** confirmed booking dates, independent of the dashboard filter */
  todayCount: number
  weekCount: number
  monthCount: number
}

interface Row {
  booking_date: string
  start_time: string
  end_time: string
  room_id: number
  reservation_id: number
  room_reservations: { department: string } | null
}

const PAGE = 1000

/** Confirmed room bookings of one year, for the admin room dashboard. */
export async function getRoomDashboardData(year: number): Promise<RoomDashboardData | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  const supabase = createServiceRoleClient()
  const today = todayJakarta()

  // PostgREST returns at most 1000 rows per request, so page through the year
  const rows: RoomDashboardRow[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('room_bookings')
      .select('booking_date, start_time, end_time, room_id, reservation_id, room_reservations!inner(department)')
      .eq('status', 'confirmed')
      .gte('booking_date', `${year}-01-01`)
      .lte('booking_date', `${year}-12-31`)
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) {
      console.error('[rooms] dashboard rows failed:', error)
      return null
    }
    for (const r of (data ?? []) as unknown as Row[]) {
      rows.push({
        date: r.booking_date,
        start: shortTime(r.start_time),
        end: shortTime(r.end_time),
        roomId: r.room_id,
        reservationId: r.reservation_id,
        department: r.room_reservations?.department?.trim() || 'Lainnya',
      })
    }
    if (!data || data.length < PAGE) break
  }

  const count = async (from: string, to: string) => {
    const { count } = await supabase
      .from('room_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('booking_date', from)
      .lte('booking_date', to)
    return count ?? 0
  }
  const weekFrom = startOfWeek(today)

  const [roomsRes, todayCount, weekCount, monthCount] = await Promise.all([
    supabase.from('rooms').select('id, name, deleted_at, sort_order').order('sort_order').order('name'),
    count(today, today),
    count(weekFrom, addDays(weekFrom, 6)),
    count(startOfMonth(today), endOfMonth(today)),
  ])

  return {
    today,
    rows,
    rooms: (roomsRes.data ?? []).map((r) => ({ id: r.id, name: r.name, active: !r.deleted_at })),
    todayCount,
    weekCount,
    monthCount,
  }
}
