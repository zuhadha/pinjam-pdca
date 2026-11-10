/**
 * Aggregations for the admin room dashboard. Same period rules as the item dashboard:
 * a year, optional months, optional week numbers, and a monthly or weekly trend.
 * Bookings are counted on the day the room is used (booking_date), one per room per day.
 */
import type { RoomDashboardData, RoomDashboardRow } from '@/lib/actions/room-dashboard-actions'
import { MONTH_LONG, formatWeekRange, summarizeMonths, summarizeWeeks, weekOfYear, weeksForMonths } from '@/lib/utils/week-utils'
import { ROOM_DAY_END, ROOM_DAY_START } from './constants'
import { timeToMinutes } from './dates'

export interface DashboardFilter {
  year: number
  months: number[]
  weeks: number[]
  view: 'month' | 'week'
}

/** A label and a count; the index signature lets chart libraries take it as-is */
export type NamedValue = { name: string; value: number } & Record<string, string | number>

export interface RoomDashboard {
  periodLabel: string
  totalBookings: number
  totalDates: number
  trendData: { date: string; total: number; range?: string }[]
  trendDescription: string
  topRooms: NamedValue[]
  topDepartments: NamedValue[]
  roomShare: NamedValue[]
  heatmap: { rooms: string[]; hours: number[]; cells: number[][]; max: number }
}

const PIE_SLICES = 4

function toDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function rank(counts: Map<string, number>): NamedValue[] {
  return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
}

export function periodLabelOf(f: DashboardFilter): string {
  return [
    f.months.length === 1
      ? `${MONTH_LONG[f.months[0] - 1]} ${f.year}`
      : f.months.length > 1
        ? `${summarizeMonths(f.months)} ${f.year}`
        : `Tahun ${f.year}`,
    f.weeks.length ? summarizeWeeks(f.weeks) : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function buildRoomDashboard(data: RoomDashboardData, f: DashboardFilter): RoomDashboard {
  const roomName = new Map(data.rooms.map((r) => [r.id, r.name]))

  const rows: RoomDashboardRow[] = data.rows.filter((r) => {
    const d = toDate(r.date)
    if (d.getFullYear() !== f.year) return false
    if (f.months.length && !f.months.includes(d.getMonth() + 1)) return false
    if (f.weeks.length && !f.weeks.includes(weekOfYear(d))) return false
    return true
  })

  // Trend: per week, per day of a single month, or per month (as on the item dashboard)
  let trendData: RoomDashboard['trendData']
  let trendDescription: string
  if (f.view === 'week') {
    const weeks = f.weeks.length ? f.weeks : weeksForMonths(f.year, f.months)
    const counts = new Map<number, number>()
    for (const r of rows) counts.set(weekOfYear(toDate(r.date)), (counts.get(weekOfYear(toDate(r.date))) ?? 0) + 1)
    trendData = weeks.map((w) => ({ date: `W${w}`, total: counts.get(w) ?? 0, range: formatWeekRange(f.year, w) }))
    trendDescription = 'Jumlah booking per minggu'
  } else if (f.months.length === 1) {
    const month = f.months[0]
    const days = new Date(f.year, month, 0).getDate()
    const counts = new Map<number, number>()
    for (const r of rows) counts.set(toDate(r.date).getDate(), (counts.get(toDate(r.date).getDate()) ?? 0) + 1)
    trendData = Array.from({ length: days }, (_, i) => ({
      date: String(i + 1).padStart(2, '0'),
      total: counts.get(i + 1) ?? 0,
      range: `${i + 1} ${MONTH_LONG[month - 1]}`,
    }))
    trendDescription = `Jumlah booking per hari · ${MONTH_LONG[month - 1]} ${f.year}`
  } else {
    const months = f.months.length ? f.months : Array.from({ length: 12 }, (_, i) => i + 1)
    const counts = new Map<number, number>()
    for (const r of rows) counts.set(toDate(r.date).getMonth() + 1, (counts.get(toDate(r.date).getMonth() + 1) ?? 0) + 1)
    trendData = months.map((m) => ({ date: MONTH_LONG[m - 1].slice(0, 3), total: counts.get(m) ?? 0, range: `${MONTH_LONG[m - 1]} ${f.year}` }))
    trendDescription = 'Jumlah booking per bulan'
  }

  // Rooms and departments
  const byRoom = new Map<string, number>()
  const byDept = new Map<string, number>()
  for (const r of rows) {
    const name = roomName.get(r.roomId) ?? `Ruangan ${r.roomId}`
    byRoom.set(name, (byRoom.get(name) ?? 0) + 1)
    byDept.set(r.department, (byDept.get(r.department) ?? 0) + 1)
  }
  const roomsRanked = rank(byRoom)
  const others = roomsRanked.slice(PIE_SLICES).reduce((sum, r) => sum + r.value, 0)
  const roomShare = [...roomsRanked.slice(0, PIE_SLICES), ...(others ? [{ name: 'Lainnya', value: others }] : [])]

  // Heatmap: active rooms (plus removed ones that still have bookings) x hours of the day
  const roomIdsWithData = new Set(rows.map((r) => r.roomId))
  const heatRooms = data.rooms.filter((r) => r.active || roomIdsWithData.has(r.id))
  const hours: number[] = []
  for (let m = timeToMinutes(ROOM_DAY_START); m < timeToMinutes(ROOM_DAY_END); m += 60) hours.push(m / 60)
  const cells = hours.map(() => heatRooms.map(() => 0))
  const col = new Map(heatRooms.map((r, i) => [r.id, i]))
  for (const r of rows) {
    const c = col.get(r.roomId)
    if (c === undefined) continue
    const s = timeToMinutes(r.start)
    const e = timeToMinutes(r.end)
    hours.forEach((h, i) => {
      if (s < (h + 1) * 60 && e > h * 60) cells[i][c]++
    })
  }

  return {
    periodLabel: periodLabelOf(f),
    totalBookings: new Set(rows.map((r) => r.reservationId)).size,
    totalDates: rows.length,
    trendData,
    trendDescription,
    topRooms: roomsRanked.slice(0, 3),
    topDepartments: rank(byDept).slice(0, 3),
    roomShare,
    heatmap: { rooms: heatRooms.map((r) => r.name), hours, cells, max: Math.max(0, ...cells.flat()) },
  }
}
