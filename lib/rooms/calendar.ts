import { addDays, addMonthsClamped, diffDays, endOfMonth, isDateString, startOfMonth, startOfWeek, timeToMinutes } from './dates'
import type { CalendarBooking, CalendarView } from './types'

export function parseView(value: unknown): CalendarView {
  return value === 'day' || value === 'month' ? value : 'week'
}

export function parseDate(value: unknown, fallback: string): string {
  return isDateString(value) ? value : fallback
}

/** First and last date the view shows. Month view pads to whole weeks (Monday first). */
export function viewRange(view: CalendarView, date: string): { from: string; to: string } {
  if (view === 'day') return { from: date, to: date }
  if (view === 'week') {
    const from = startOfWeek(date)
    return { from, to: addDays(from, 6) }
  }
  const from = startOfWeek(startOfMonth(date))
  const last = endOfMonth(date)
  const to = addDays(startOfWeek(last), 6)
  return { from, to }
}

export function shiftDate(view: CalendarView, date: string, step: 1 | -1): string {
  if (view === 'day') return addDays(date, step)
  if (view === 'week') return addDays(date, 7 * step)
  return addMonthsClamped(startOfMonth(date), step, 1)
}

export interface PlacedBooking {
  booking: CalendarBooking
  lane: number
  lanes: number
}

/**
 * Side-by-side layout for overlapping bookings in one day column.
 * Bookings that overlap share a cluster; each gets a lane, and every
 * booking in the cluster knows the cluster's lane count.
 */
export function layoutLanes(bookings: CalendarBooking[]): PlacedBooking[] {
  const sorted = [...bookings].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time) || timeToMinutes(b.end_time) - timeToMinutes(a.end_time)
  )
  const placed: PlacedBooking[] = []
  let cluster: PlacedBooking[] = []
  let laneEnds: number[] = []
  let clusterEnd = -1

  const closeCluster = () => {
    for (const p of cluster) p.lanes = laneEnds.length
    cluster = []
    laneEnds = []
  }

  for (const booking of sorted) {
    const start = timeToMinutes(booking.start_time)
    const end = timeToMinutes(booking.end_time)
    if (start >= clusterEnd) closeCluster()
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }
    const p = { booking, lane, lanes: 1 }
    cluster.push(p)
    placed.push(p)
    clusterEnd = Math.max(clusterEnd, end)
  }
  closeCluster()
  return placed
}

export function groupByDate(bookings: CalendarBooking[]): Map<string, CalendarBooking[]> {
  const map = new Map<string, CalendarBooking[]>()
  for (const b of bookings) map.set(b.booking_date, [...(map.get(b.booking_date) ?? []), b])
  return map
}

/** Consecutive days of one reservation in the same room, at the same time and status. */
export interface BookingSpan {
  key: string
  first: CalendarBooking
  from: string
  to: string
  ids: number[]
}

/**
 * Groups bookings into spans: one reservation, same room, same time, same status,
 * on dates that follow each other with no gap. A one-day booking is a span of one day.
 */
export function mergeSpans(bookings: CalendarBooking[]): BookingSpan[] {
  const groups = new Map<string, CalendarBooking[]>()
  for (const b of bookings) {
    const key = `${b.reservation_id}|${b.room_id}|${b.start_time}|${b.end_time}|${b.status}`
    groups.set(key, [...(groups.get(key) ?? []), b])
  }
  const spans: BookingSpan[] = []
  for (const [key, list] of groups) {
    list.sort((a, b) => (a.booking_date < b.booking_date ? -1 : 1))
    let current: BookingSpan | null = null
    for (const b of list) {
      if (current && addDays(current.to, 1) === b.booking_date) {
        current.to = b.booking_date
        current.ids.push(b.id)
      } else {
        current = { key: `${key}|${b.booking_date}`, first: b, from: b.booking_date, to: b.booking_date, ids: [b.id] }
        spans.push(current)
      }
    }
  }
  return spans.sort(
    (a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : timeToMinutes(a.first.start_time) - timeToMinutes(b.first.start_time))
  )
}

export interface SpanSegment {
  span: BookingSpan
  /** first and last column (0 = Monday) the span covers in this week */
  start: number
  end: number
  lane: number
  continuesBefore: boolean
  continuesAfter: boolean
}

/** The part of each multi-day span that falls in the week starting at weekFrom, stacked into lanes. */
export function weekSegments(spans: BookingSpan[], weekFrom: string): { segments: SpanSegment[]; lanes: number } {
  const weekTo = addDays(weekFrom, 6)
  const segments: SpanSegment[] = spans
    .filter((s) => s.from !== s.to && s.from <= weekTo && s.to >= weekFrom)
    .map((s) => ({
      span: s,
      start: Math.max(0, diffDays(weekFrom, s.from)),
      end: Math.min(6, diffDays(weekFrom, s.to)),
      lane: 0,
      continuesBefore: s.from < weekFrom,
      continuesAfter: s.to > weekTo,
    }))
    .sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))
  const laneEnds: number[] = []
  for (const seg of segments) {
    let lane = laneEnds.findIndex((end) => end < seg.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(seg.end)
    } else {
      laneEnds[lane] = seg.end
    }
    seg.lane = lane
  }
  return { segments, lanes: laneEnds.length }
}

/** Single-day spans, per date, for the parts of a view that list day by day. */
export function singleDayByDate(spans: BookingSpan[]): Map<string, CalendarBooking[]> {
  const map = new Map<string, CalendarBooking[]>()
  for (const s of spans) if (s.from === s.to) map.set(s.from, [...(map.get(s.from) ?? []), s.first])
  return map
}

/** Days loaded beyond the visible week or month, so a merged booking shows its full date range. */
const SPAN_MARGIN_DAYS = 31

/** Date range to load for a view: the visible days, padded for week and month views. */
export function fetchRange(view: CalendarView, date: string): { from: string; to: string } {
  const { from, to } = viewRange(view, date)
  if (view === 'day') return { from, to }
  return { from: addDays(from, -SPAN_MARGIN_DAYS), to: addDays(to, SPAN_MARGIN_DAYS) }
}

export type DateRange = { from: string; to: string }
