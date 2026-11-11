'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { getReservationDates } from '@/lib/actions/room-actions'
import { ROOM_DAY_END, ROOM_DAY_START, ROOM_SLOT_MINUTES } from '@/lib/rooms/constants'
import {
  DAY_NAMES_SHORT,
  addDays,
  diffDays,
  formatDateList,
  formatDateLong,
  formatDateShort,
  formatMonth,
  formatRange,
  minutesToTime,
  nowTimeJakarta,
  timeToMinutes,
} from '@/lib/rooms/dates'
import {
  groupByDate,
  layoutLanes,
  mergeSpans,
  shiftDate,
  singleDayByDate,
  viewRange,
  weekSegments,
  type BookingSpan,
  type DateRange,
  type SpanSegment,
} from '@/lib/rooms/calendar'
import type { CalendarBooking, CalendarView, Room } from '@/lib/rooms/types'

const DAY_START = timeToMinutes(ROOM_DAY_START)
const DAY_END = timeToMinutes(ROOM_DAY_END)
const DAY_SPAN = DAY_END - DAY_START
const HOURS = Array.from({ length: DAY_SPAN / 60 + 1 }, (_, i) => DAY_START + i * 60)
const SLOTS = Array.from({ length: DAY_SPAN / ROOM_SLOT_MINUTES }, (_, i) => DAY_START + i * ROOM_SLOT_MINUTES)
const HOUR_PX = 56

export type { DateRange }

type SlotRenderer = (date: string, start: number | undefined, room: number | null, className: string, style: React.CSSProperties) => React.ReactNode

export interface RoomCalendarProps {
  view: CalendarView
  date: string
  today: string
  roomId: number | null
  rooms: Room[]
  bookings: CalendarBooking[]
  /** page the calendar lives on, e.g. '/rooms' or '/admin' */
  basePath: string
  /** query params to keep when navigating, e.g. { section: 'rooms' } */
  baseQuery?: Record<string, string>
  /** called when a booking is clicked (with its date range when merged); without it a read-only detail opens */
  onSelect?: (booking: CalendarBooking, range?: DateRange) => void
  /** called when an empty slot is clicked; without it the slot links to the booking form */
  onSlot?: (slot: { date: string; start?: string; roomId: number | null }) => void
  /** shows "Booking ulang" in the booking detail; fills the form with this booking except its date */
  onRebook?: (booking: CalendarBooking) => void
}

export function RoomCalendar(props: RoomCalendarProps) {
  const { view, date, today, roomId, rooms, bookings, basePath, baseQuery, onSelect, onSlot, onRebook } = props
  const router = useRouter()
  const [detailState, setDetailState] = useState<{ booking: CalendarBooking; range?: DateRange } | null>(null)
  const detail = detailState?.booking ?? null
  const setDetail = (b: CalendarBooking | null) => setDetailState(b ? { booking: b } : null)
  const [nowMin, setNowMin] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNowMin(timeToMinutes(nowTimeJakarta()))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  const roomName = useMemo(() => new Map(rooms.map((r) => [r.id, r.name])), [rooms])
  const visibleRooms = roomId ? rooms.filter((r) => r.id === roomId) : rooms
  // Search filters what is drawn, in the browser; navigating keeps the text
  const [query, setQuery] = useState('')
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return bookings
    return bookings.filter((b) =>
      [b.agenda, b.borrower_name, b.department, roomName.get(b.room_id) ?? ''].some((v) => v.toLowerCase().includes(q))
    )
  }, [bookings, query, roomName])
  const byDate = useMemo(() => groupByDate(shown), [shown])
  const { from, to } = viewRange(view, date)

  const href = (next: Partial<{ cal: CalendarView; date: string; room: number | null }>) => {
    const q = new URLSearchParams(baseQuery)
    q.set('cal', next.cal ?? view)
    q.set('date', next.date ?? date)
    const r = next.room === undefined ? roomId : next.room
    if (r) q.set('room', String(r))
    return `${basePath}?${q.toString()}`
  }

  const bookHref = (d: string, start?: number, room?: number | null) => {
    const q = new URLSearchParams({ book_date: d })
    if (start !== undefined) q.set('start', minutesToTime(start))
    const r = room ?? roomId
    if (r) q.set('book_room', String(r))
    return `/rooms?${q.toString()}#booking`
  }

  /** Empty half-hour cell (or a whole day in week view): fills the form on this page, or links to it. Mouse only; the form is the keyboard path. */
  const slot = (d: string, start: number | undefined, room: number | null, className: string, style: React.CSSProperties) =>
    onSlot ? (
      <button
        key={`${d}-${start ?? ''}`}
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={() => onSlot({ date: d, start: start === undefined ? undefined : minutesToTime(start), roomId: room ?? roomId })}
        className={className}
        style={style}
      />
    ) : (
      <Link key={`${d}-${start ?? ''}`} href={bookHref(d, start, room)} tabIndex={-1} aria-hidden className={className} style={style} />
    )

  const open = (b: CalendarBooking, range?: DateRange) =>
    onSelect ? onSelect(b, range) : setDetailState({ booking: b, range })
  // Consecutive days of one booking are drawn as one item in the week and month views
  const spans = useMemo(() => mergeSpans(shown), [shown])
  // Matches among the days on screen (bookings outside them are loaded only to merge runs of days)
  const matchCount = query.trim() ? shown.filter((b) => b.booking_date >= from && b.booking_date <= to).length : 0

  const title = view === 'day' ? formatDateLong(date) : view === 'week' ? formatRange(from, to) : formatMonth(date)
  const showRoomOnBlock = !roomId

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pb-4">
        <div className="flex items-center gap-1">
          <Link
            scroll={false}
            href={href({ date: shiftDate(view, date, -1) })}
            aria-label="Sebelumnya"
            className="grid h-9 w-9 place-items-center rounded-md text-gray-700 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Link
            scroll={false}
            href={href({ date: today })}
            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Hari ini
          </Link>
          <Link
            scroll={false}
            href={href({ date: shiftDate(view, date, 1) })}
            aria-label="Berikutnya"
            className="grid h-9 w-9 place-items-center rounded-md text-gray-700 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <p className="min-w-0 flex-1 text-base font-semibold text-gray-900" aria-live="polite">
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Tampilan kalender" className="inline-flex rounded-md bg-gray-100 p-0.5">
            {(['day', 'week', 'month'] as const).map((v) => (
              <Link
                key={v}
                scroll={false}
                href={href({ cal: v })}
                aria-current={v === view ? 'page' : undefined}
                className={`inline-flex h-8 items-center rounded px-3 text-sm font-medium ${
                  v === view ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {v === 'day' ? 'Hari' : v === 'week' ? 'Minggu' : 'Bulan'}
              </Link>
            ))}
          </nav>
          <label className="sr-only" htmlFor="room-filter">
            Filter ruangan
          </label>
          <select
            id="room-filter"
            value={roomId ?? ''}
            onChange={(e) => router.push(href({ room: e.target.value ? Number(e.target.value) : null }), { scroll: false })}
            className="h-9 rounded-md border border-gray-300 bg-white pl-3 pr-8 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
          >
            <option value="">Semua ruangan</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-4">
        <div className="relative w-full sm:w-80">
          <label htmlFor="calendar-search" className="sr-only">
            Cari booking
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            id="calendar-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari agenda, peminjam, departemen…"
            autoComplete="off"
            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Hapus pencarian"
              className="absolute inset-y-0 right-2 flex items-center px-1 text-gray-400 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {query.trim() && (
          <p className="text-sm text-gray-600" aria-live="polite">
            {matchCount ? (
              <>
                <span className="font-medium text-gray-900 tabular-nums">{matchCount}</span> booking cocok di{' '}
                {view === 'day' ? 'hari' : view === 'week' ? 'minggu' : 'bulan'} ini
              </>
            ) : (
              `Tidak ada booking yang cocok di ${view === 'day' ? 'hari' : view === 'week' ? 'minggu' : 'bulan'} ini`
            )}
          </p>
        )}
      </div>

      {view === 'day' && (
        <DayTimeline
          date={date}
          isToday={date === today}
          nowMin={nowMin}
          rooms={visibleRooms}
          bookings={byDate.get(date) ?? []}
          onOpen={open}
          slot={slot}
          pastDay={date < today}
        />
      )}
      {view === 'week' && (
        <WeekGrid
          from={from}
          today={today}
          rooms={visibleRooms}
          spans={spans}
          roomName={roomName}
          showRoom={showRoomOnBlock}
          onOpen={open}
          slot={slot}
          dayHref={(d) => href({ cal: 'day', date: d })}
        />
      )}
      {view === 'month' && (
        <MonthGrid
          from={from}
          to={to}
          month={date.slice(0, 7)}
          today={today}
          byDate={byDate}
          spans={spans}
          roomName={roomName}
          showRoom={showRoomOnBlock}
          onOpen={open}
          dayHref={(d) => href({ cal: 'day', date: d })}
        />
      )}

      <Legend />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.agenda ?? ''}>
        {detail && (
          <>
            <BookingFacts booking={detail} roomName={roomName.get(detail.room_id) ?? '-'} range={detailState?.range} />
            {onRebook && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onRebook(detail)
                    setDetail(null)
                  }}
                  className="inline-flex h-10 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                >
                  Booking ulang
                </button>
                <p className="mt-2 text-xs text-gray-600">Isi form dengan detail booking ini. Tinggal pilih tanggal baru.</p>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

// ─── Blocks ───────────────────────────────────────────────────────────────────

function blockClass(status: CalendarBooking['status']) {
  return status === 'confirmed'
    ? 'bg-blue-50 border-l-[3px] border-blue-600 text-gray-900 hover:bg-blue-100'
    : 'bg-white border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50'
}

function BookingBlock({
  booking,
  roomName,
  compact,
  wrap,
  range,
  onOpen,
  style,
  className = '',
}: {
  booking: CalendarBooking
  roomName?: string
  /** the block stands for consecutive days */
  range?: DateRange
  compact?: boolean
  /** let text wrap inside tall, narrow blocks instead of cutting it off */
  wrap?: boolean
  onOpen: (b: CalendarBooking, range?: DateRange) => void
  style?: React.CSSProperties
  className?: string
}) {
  const waiting = booking.status === 'waitlisted'
  return (
    <button
      type="button"
      onClick={() => onOpen(booking, range)}
      style={style}
      className={`overflow-hidden rounded text-left text-xs leading-tight focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gray-900 ${blockClass(booking.status)} ${className}`}
      aria-label={`${booking.agenda}, ${range ? `${formatDateShort(range.from)} – ${formatDateShort(range.to)}, ` : ''}${booking.start_time}–${booking.end_time}${roomName ? `, ${roomName}` : ''}${waiting ? ', daftar tunggu' : ''}`}
    >
      <span className={`block font-medium ${wrap ? 'text-[13px] break-normal' : 'truncate'}`}>
        {waiting && <span className="font-normal">Tunggu · </span>}
        {booking.agenda}
      </span>
      {!compact && (
        <span className={`block text-gray-600 tabular-nums ${wrap ? 'break-normal' : 'truncate'}`}>
          {booking.start_time}–{booking.end_time}
          {roomName ? ` · ${roomName}` : ` · ${booking.department}`}
        </span>
      )}
    </button>
  )
}

// ─── Day: rooms across, hours down ───────────────────────────────────────────

function DayTimeline({
  date,
  isToday,
  nowMin,
  rooms,
  bookings,
  onOpen,
  slot,
  pastDay,
}: {
  date: string
  isToday: boolean
  nowMin: number | null
  rooms: Room[]
  bookings: CalendarBooking[]
  onOpen: (b: CalendarBooking) => void
  slot: SlotRenderer
  pastDay: boolean
}) {
  const height = (DAY_SPAN / 60) * HOUR_PX
  const y = (min: number) => ((min - DAY_START) / 60) * HOUR_PX
  const showNow = isToday && nowMin !== null && nowMin >= DAY_START && nowMin <= DAY_END

  if (!rooms.length) {
    return <p className="rounded-md border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-600">Belum ada ruangan.</p>
  }

  // Each room keeps at least 140px; on narrow screens the grid scrolls sideways with the hours pinned
  const columns = { gridTemplateColumns: `56px repeat(${rooms.length}, minmax(140px, 1fr))` }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <div className="grid border-b border-gray-200" style={columns}>
        <div className="sticky left-0 z-20 bg-white" />
        {rooms.map((room) => (
          <div key={room.id} className="min-w-0 border-l border-gray-100 px-2 py-2">
            <p className="truncate text-sm font-medium text-gray-900" title={room.name}>
              {room.name}
            </p>
          </div>
        ))}
      </div>
      <div className="grid" style={columns}>
        <div className="sticky left-0 z-20 bg-white" style={{ height }}>
          {HOURS.slice(0, -1).map((h) => (
            <span key={h} className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-gray-500" style={{ top: Math.max(8, y(h)) }}>
              {minutesToTime(h)}
            </span>
          ))}
        </div>
        {rooms.map((room) => {
          const placed = layoutLanes(bookings.filter((b) => b.room_id === room.id))
          return (
            <div key={room.id} className="relative border-l border-gray-100" style={{ height }}>
              {HOURS.slice(1, -1).map((h) => (
                <span key={h} className="absolute inset-x-0 h-px bg-gray-100" style={{ top: y(h) }} aria-hidden />
              ))}
              {!pastDay &&
                SLOTS.map((s) =>
                  slot(date, s, room.id, 'absolute inset-x-0 hover:bg-gray-100/70', {
                    top: y(s),
                    height: (ROOM_SLOT_MINUTES / 60) * HOUR_PX,
                  })
                )}
              {showNow && <span className="absolute inset-x-0 z-10 h-px bg-blue-600" style={{ top: y(nowMin!) }} aria-hidden />}
              {placed.map(({ booking, lane, lanes }) => {
                const s = timeToMinutes(booking.start_time)
                const e = timeToMinutes(booking.end_time)
                const h = y(e) - y(s)
                return (
                  <BookingBlock
                    key={booking.id}
                    booking={booking}
                    compact={h < 40 || lanes >= 3}
                    wrap={h >= 40}
                    onOpen={onOpen}
                    className="absolute flex flex-col justify-start px-1.5 py-1"
                    style={{
                      top: y(s) + 1,
                      height: h - 2,
                      left: `calc(${(lane / lanes) * 100}% + 2px)`,
                      width: `calc(${100 / lanes}% - 4px)`,
                    }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Multi-day bar ────────────────────────────────────────────────────────────

function rangeText(from: string, to: string) {
  return `${formatDateShort(from)} – ${formatDateShort(to)}`
}

/** One bar for a span of consecutive days. Square ends mean it continues outside this week. */
function SpanBar({
  segment,
  roomName,
  onOpen,
  style,
  className = '',
  showRange,
}: {
  segment: Pick<SpanSegment, 'span' | 'continuesBefore' | 'continuesAfter'>
  roomName?: string
  onOpen: (b: CalendarBooking, range?: DateRange) => void
  style?: React.CSSProperties
  className?: string
  /** print the date range in the bar (used where the bar does not span its days) */
  showRange?: boolean
}) {
  const { span, continuesBefore, continuesAfter } = segment
  const b = span.first
  const waiting = b.status === 'waitlisted'
  const days = diffDays(span.from, span.to) + 1
  return (
    <button
      type="button"
      onClick={() => onOpen(b, { from: span.from, to: span.to })}
      style={style}
      aria-label={`${b.agenda}, ${rangeText(span.from, span.to)} (${days} hari), ${b.start_time}–${b.end_time}${roomName ? `, ${roomName}` : ''}${waiting ? ', daftar tunggu' : ''}`}
      className={`flex min-w-0 items-center gap-1.5 overflow-hidden rounded px-1.5 text-left text-xs leading-tight focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gray-900 ${blockClass(b.status)} ${
        continuesBefore ? 'rounded-l-none' : ''
      } ${continuesAfter ? 'rounded-r-none' : ''} ${className}`}
    >
      {showRange ? (
        // Two lines, like the other list items: agenda, then days, time and room
        <span className="min-w-0">
          <span className="block font-medium">
            {waiting && <span className="font-normal">Tunggu · </span>}
            {b.agenda}
          </span>
          <span className="block text-gray-600 tabular-nums">
            {rangeText(span.from, span.to)} · {b.start_time}–{b.end_time}
            {roomName ? ` · ${roomName}` : ` · ${b.department}`}
          </span>
        </span>
      ) : (
        <>
          <span className="shrink-0 tabular-nums text-gray-600">{b.start_time}</span>
          <span className="truncate font-medium">
            {waiting && <span className="font-normal">Tunggu · </span>}
            {b.agenda}
            {roomName && <span className="font-normal text-gray-600"> · {roomName}</span>}
          </span>
        </>
      )}
    </button>
  )
}

// ─── Week: rooms down, days across ───────────────────────────────────────────

function WeekGrid({
  from,
  today,
  rooms,
  spans,
  roomName,
  showRoom,
  onOpen,
  slot,
  dayHref,
}: {
  from: string
  today: string
  rooms: Room[]
  spans: BookingSpan[]
  roomName: Map<number, string>
  showRoom: boolean
  onOpen: (b: CalendarBooking, range?: DateRange) => void
  slot: SlotRenderer
  dayHref: (d: string) => string
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i))
  const singles = singleDayByDate(spans)
  const { segments } = weekSegments(spans, from)
  // Each day keeps at least 120px; on narrow screens the grid scrolls sideways with the rooms pinned
  const columns = { gridTemplateColumns: '160px repeat(7, minmax(120px, 1fr))' }
  const dayBg = (d: string, i: number) => (d === today ? 'bg-blue-50/50' : i >= 5 ? 'bg-gray-50' : '')

  return (
    <>
      {/* Desktop and tablet: one row per room, one column per day */}
      {rooms.length ? (
        <div className="hidden overflow-x-auto rounded-md border border-gray-200 bg-white md:block">
          <div className="grid border-b border-gray-200" style={columns}>
            <div className="sticky left-0 z-20 border-r border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">Ruangan</div>
            {days.map((d, i) => (
              <Link
                key={d}
                scroll={false}
                href={dayHref(d)}
                className={`border-l border-gray-100 px-2 py-2 text-sm hover:bg-gray-100 ${dayBg(d, i)}`}
              >
                <span className="text-gray-500">{DAY_NAMES_SHORT[i]}</span>{' '}
                <span className={`tabular-nums ${d === today ? 'rounded bg-blue-600 px-1.5 py-0.5 font-semibold text-white' : 'font-medium text-gray-900'}`}>
                  {Number(d.slice(8))}
                </span>
              </Link>
            ))}
          </div>

          {rooms.map((room) => {
            const roomSpans = spans.filter((s) => s.first.room_id === room.id)
            const roomSingles = singleDayByDate(roomSpans)
            const { segments: bars, lanes } = weekSegments(roomSpans, from)
            return (
              <div
                key={room.id}
                className="grid min-h-16 border-b border-gray-100 last:border-b-0"
                style={{ ...columns, gridTemplateRows: `${lanes ? `repeat(${lanes}, 24px) ` : ''}1fr` }}
              >
                <div
                  className="sticky left-0 z-20 min-w-0 border-r border-gray-200 bg-white px-3 py-2"
                  style={{ gridColumn: 1, gridRow: '1 / -1' }}
                >
                  <p className="truncate text-sm font-medium text-gray-900" title={room.name}>
                    {room.name}
                  </p>
                </div>
                {/* Day cells, behind the bookings; an empty spot opens the form for that room and day */}
                {days.map((d, i) => {
                  const className = `border-l border-gray-100 ${dayBg(d, i)}`
                  const style = { gridColumn: i + 2, gridRow: '1 / -1' }
                  return d < today ? (
                    <div key={d} className={className} style={style} aria-hidden />
                  ) : (
                    slot(d, undefined, room.id, `${className} hover:bg-gray-100/70`, style)
                  )
                })}
                {/* A run of days is one bar across its columns */}
                {bars.map((seg) => (
                  <SpanBar
                    key={seg.span.key}
                    segment={seg}
                    onOpen={onOpen}
                    className="relative mx-0.5 mt-1 h-[20px]"
                    style={{ gridColumn: `${seg.start + 2} / ${seg.end + 3}`, gridRow: seg.lane + 1 }}
                  />
                ))}
                {days.map((d, i) => {
                  const list = roomSingles.get(d) ?? []
                  if (!list.length) return null
                  return (
                    <div
                      key={`s-${d}`}
                      className="pointer-events-none relative min-w-0 space-y-1 p-1"
                      style={{ gridColumn: i + 2, gridRow: lanes + 1 }}
                    >
                      {list.map((b) => (
                        <BookingBlock
                          key={b.id}
                          booking={b}
                          onOpen={onOpen}
                          className="pointer-events-auto block w-full px-1.5 py-1"
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="hidden rounded-md border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-600 md:block">
          Belum ada ruangan.
        </p>
      )}

      {/* Phone: one list per day; a multi-day booking is listed once, on its first day this week */}
      <ol className="space-y-4 md:hidden">
        {days.map((d, i) => {
          const list = singles.get(d) ?? []
          const starting = segments.filter((seg) => seg.start === i)
          const busy = list.length + segments.filter((seg) => seg.start <= i && seg.end >= i).length
          return (
            <li key={d}>
              <Link scroll={false} href={dayHref(d)} className="flex items-baseline justify-between py-1">
                <span className={`text-sm font-semibold ${d === today ? 'text-blue-700' : 'text-gray-900'}`}>
                  {formatDateShort(d)}
                  {d === today ? ' · hari ini' : ''}
                </span>
                <span className="text-xs text-gray-500 tabular-nums">{busy ? `${busy} booking` : 'kosong'}</span>
              </Link>
              {(starting.length > 0 || list.length > 0) && (
                <div className="mt-1 space-y-1">
                  {starting.map((seg) => (
                    <SpanBar
                      key={seg.span.key}
                      segment={seg}
                      roomName={showRoom ? roomName.get(seg.span.first.room_id) : undefined}
                      onOpen={onOpen}
                      showRange
                      className="h-auto w-full px-3 py-2 text-sm"
                    />
                  ))}
                  {list.map((b) => (
                    <BookingBlock
                      key={b.id}
                      booking={b}
                      roomName={showRoom ? roomName.get(b.room_id) : undefined}
                      wrap
                      onOpen={onOpen}
                      className="block w-full px-3 py-2 text-sm"
                    />
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}

// ─── Month ────────────────────────────────────────────────────────────────────

const MONTH_LANES = 3

function MonthGrid({
  from,
  to,
  month,
  today,
  byDate,
  spans,
  roomName,
  showRoom,
  onOpen,
  dayHref,
}: {
  from: string
  to: string
  month: string
  today: string
  byDate: Map<string, CalendarBooking[]>
  spans: BookingSpan[]
  roomName: Map<number, string>
  showRoom: boolean
  onOpen: (b: CalendarBooking, range?: DateRange) => void
  dayHref: (d: string) => string
}) {
  const weeks: string[] = []
  for (let d = from; d <= to; d = addDays(d, 7)) weeks.push(d)
  const singles = singleDayByDate(spans)

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAY_NAMES_SHORT.map((n, i) => (
          <div key={n} className={`px-2 py-2 text-xs text-gray-500 ${i >= 5 ? 'bg-gray-50' : ''}`}>
            {n}
          </div>
        ))}
      </div>
      {weeks.map((weekFrom) => {
        const days = Array.from({ length: 7 }, (_, i) => addDays(weekFrom, i))
        const { segments, lanes } = weekSegments(spans, weekFrom)
        const shownLanes = Math.min(lanes, MONTH_LANES)
        const singlesAllowed = Math.max(0, MONTH_LANES - shownLanes)
        return (
          <div
            key={weekFrom}
            className="grid min-h-20 grid-cols-7 md:min-h-28"
            style={{ gridTemplateRows: `auto${shownLanes ? ` repeat(${shownLanes}, 22px)` : ''} 1fr` }}
          >
            {/* Day backgrounds and borders, behind everything in the row */}
            {days.map((d, i) => (
              <div
                key={`bg-${d}`}
                aria-hidden
                className={`border-b border-gray-100 ${i ? 'border-l' : ''} ${i >= 5 ? 'bg-gray-50' : ''}`}
                style={{ gridColumn: i + 1, gridRow: '1 / -1' }}
              />
            ))}
            {days.map((d, i) => {
              const total = (byDate.get(d) ?? []).length
              return (
                <div key={`n-${d}`} className="px-1 pt-1 md:px-1.5 md:pt-1.5" style={{ gridColumn: i + 1, gridRow: 1 }}>
                  <Link
                    scroll={false}
                    href={dayHref(d)}
                    className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded px-1 text-xs tabular-nums hover:bg-gray-200 ${
                      d === today
                        ? 'bg-blue-600 font-semibold text-white hover:bg-blue-700'
                        : d.startsWith(month)
                          ? 'font-medium text-gray-900'
                          : 'text-gray-400'
                    }`}
                    aria-label={`${formatDateLong(d)}, ${total} booking`}
                  >
                    {Number(d.slice(8))}
                  </Link>
                  {/* Phone: a count instead of bars */}
                  {total > 0 && (
                    <Link scroll={false} href={dayHref(d)} className="block text-xs text-gray-700 tabular-nums md:hidden">
                      {total} booking
                    </Link>
                  )}
                </div>
              )
            })}
            {segments
              .filter((seg) => seg.lane < MONTH_LANES)
              .map((seg) => (
                <SpanBar
                  key={seg.span.key}
                  segment={seg}
                  roomName={showRoom ? roomName.get(seg.span.first.room_id) : undefined}
                  onOpen={onOpen}
                  className="mx-0.5 hidden h-[20px] md:flex"
                  style={{ gridColumn: `${seg.start + 1} / ${seg.end + 2}`, gridRow: seg.lane + 2 }}
                />
              ))}
            {days.map((d, i) => {
              const list = singles.get(d) ?? []
              const hiddenBars = segments.filter((seg) => seg.lane >= MONTH_LANES && seg.start <= i && seg.end >= i).length
              const more = Math.max(0, list.length - singlesAllowed) + hiddenBars
              return (
                <div
                  key={`s-${d}`}
                  className="hidden min-w-0 space-y-0.5 px-1 pb-1 pt-0.5 md:block md:px-1.5"
                  style={{ gridColumn: i + 1, gridRow: shownLanes + 2 }}
                >
                  {list.slice(0, singlesAllowed).map((b) => (
                    <BookingBlock
                      key={b.id}
                      booking={b}
                      compact
                      onOpen={onOpen}
                      className="block w-full px-1.5 py-0.5"
                      roomName={showRoom ? roomName.get(b.room_id) : undefined}
                    />
                  ))}
                  {more > 0 && (
                    <Link scroll={false} href={dayHref(d)} className="block px-1.5 text-xs text-gray-600 hover:text-gray-900">
                      +{more} lainnya
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── Legend and detail ───────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 text-xs text-gray-600">
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-5 rounded-sm border-l-[3px] border-blue-600 bg-blue-50" aria-hidden />
        Terkonfirmasi
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-5 rounded-sm border border-dashed border-gray-400 bg-white" aria-hidden />
        Daftar tunggu
      </span>
    </div>
  )
}

export function BookingFacts({
  booking,
  roomName,
  range,
}: {
  booking: CalendarBooking
  roomName: string
  /** merged consecutive days that were clicked; used until all dates are loaded */
  range?: DateRange
}) {
  // A repeating booking is one agenda: list all of its dates, not only the clicked run
  const [all, setAll] = useState<{ date: string; status: CalendarBooking['status'] }[] | null>(null)
  useEffect(() => {
    if (booking.recurrence_type === 'none') return
    let alive = true
    getReservationDates(booking.reservation_id).then((d) => alive && setAll(d))
    return () => {
      alive = false
    }
  }, [booking.reservation_id, booking.recurrence_type])

  let dateText: string
  if (all && all.length > 1) {
    const waiting = all.filter((d) => d.status === 'waitlisted').length
    dateText = `${formatDateList(all.map((d) => d.date))} (${all.length} tanggal${waiting ? `, ${waiting} daftar tunggu` : ''})`
  } else if (range && range.from !== range.to) {
    dateText = `${formatDateShort(range.from)} – ${formatDateShort(range.to, true)} (${diffDays(range.from, range.to) + 1} hari)`
  } else {
    dateText = formatDateLong(booking.booking_date)
  }

  const rows: [string, React.ReactNode][] = [
    ['Tanggal', dateText],
    ['Waktu', `${booking.start_time}–${booking.end_time}`],
    ['Ruangan', roomName],
    ['Peminjam', `${booking.borrower_name} · ${booking.department}`],
    ['Peserta', booking.people_count ? `${booking.people_count} orang` : '-'],
    ['Status', booking.status === 'confirmed' ? 'Terkonfirmasi' : booking.status === 'waitlisted' ? 'Daftar tunggu' : 'Dibatalkan'],
  ]
  return (
    <div>
      <dl className="grid grid-cols-[96px_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-gray-500">{k}</dt>
            <dd className="text-gray-900">{v}</dd>
          </div>
        ))}
      </dl>
      {booking.status === 'waitlisted' && (
        <p className="mt-4 text-sm text-gray-700">
          Jam ini sudah dibooking orang lain. Booking ini menunggu; admin menghubungi peminjam bila ruangan kosong.
        </p>
      )}
    </div>
  )
}
