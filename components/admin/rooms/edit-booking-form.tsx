'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { adminPreviewMove, adminUpdateBooking, type MoveConflict } from '@/lib/actions/room-admin-actions'
import { ROOM_DAY_END, ROOM_DAY_START, ROOM_SLOT_MINUTES } from '@/lib/rooms/constants'
import { formatDateShort, minutesToTime, timeToMinutes } from '@/lib/rooms/dates'
import type { CalendarBooking, Room } from '@/lib/rooms/types'

const START = timeToMinutes(ROOM_DAY_START)
const END = timeToMinutes(ROOM_DAY_END)
const TIMES = Array.from({ length: (END - START) / ROOM_SLOT_MINUTES + 1 }, (_, i) => minutesToTime(START + i * ROOM_SLOT_MINUTES))
const FULL_DAY = 'full'

const fieldClass =
  'mt-1.5 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100 disabled:text-gray-600'
const labelClass = 'block text-sm font-medium text-gray-900'
const toggleClass = (on: boolean) =>
  `h-10 rounded-md px-2 text-sm font-medium transition-colors ${
    on ? 'bg-gray-900 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  }`

interface Props {
  booking: CalendarBooking
  rooms: Room[]
  onDone: (message: string) => void
  onBack: () => void
}

/** Admin edit of one booking date: room, date and time, or room and time for the rest of a series. */
export function EditBookingForm({ booking, rooms, onDone, onBack }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const recurring = booking.recurrence_type !== 'none'
  const bookable = rooms.filter((r) => r.status === 'available' || r.id === booking.room_id)

  const [scope, setScope] = useState<'one' | 'upcoming'>('one')
  const [roomId, setRoomId] = useState(booking.room_id)
  const [date, setDate] = useState(booking.booking_date)
  const [startTime, setStartTime] = useState(booking.start_time)
  const [endTime, setEndTime] = useState(booking.end_time)
  const [notify, setNotify] = useState(true)

  const isFullDay = startTime === ROOM_DAY_START && endTime === ROOM_DAY_END
  const onStartChange = (v: string) => {
    if (v === FULL_DAY) {
      setStartTime(ROOM_DAY_START)
      setEndTime(ROOM_DAY_END)
      return
    }
    setStartTime(v)
    if (timeToMinutes(endTime) <= timeToMinutes(v)) setEndTime(minutesToTime(Math.min(END, timeToMinutes(v) + 60)))
  }

  const changed =
    roomId !== booking.room_id ||
    (scope === 'one' && date !== booking.booking_date) ||
    startTime !== booking.start_time ||
    endTime !== booking.end_time

  // Live clash check, debounced; each result remembers the input it answers
  const key = changed ? JSON.stringify([scope, roomId, date, startTime, endTime]) : ''
  const [preview, setPreview] = useState<{ key: string; error?: string; count: number; conflicts: MoveConflict[] }>({
    key: '',
    count: 0,
    conflicts: [],
  })
  const latestKey = useRef('')
  useEffect(() => {
    latestKey.current = key
    if (!key) return
    const t = setTimeout(async () => {
      const res = await adminPreviewMove({ bookingId: booking.id, roomId, date, startTime, endTime, scope })
      if (latestKey.current === key) setPreview({ key, ...res })
    }, 300)
    return () => clearTimeout(t)
  }, [key, booking.id, roomId, date, startTime, endTime, scope])
  const checking = !!key && preview.key !== key
  const current = preview.key === key ? preview : null
  const conflicts = current?.conflicts ?? []

  const save = () =>
    startTransition(async () => {
      const res = await adminUpdateBooking({
        bookingId: booking.id,
        roomId,
        date,
        startTime,
        endTime,
        scope,
        notify,
        allowWaitlist: conflicts.length > 0,
      })
      if (res.error) {
        toast.error(res.error)
        if (res.conflicts) setPreview({ key, count: current?.count ?? 0, conflicts: res.conflicts })
        router.refresh()
        return
      }
      onDone(
        res.waitlisted
          ? `${res.updated} tanggal diubah, ${res.waitlisted} masuk daftar tunggu`
          : `${res.updated} tanggal diubah`
      )
    })

  return (
    <div className="mt-6 space-y-4 border-t border-gray-200 pt-5">
      <h3 className="text-sm font-semibold text-gray-900">Ubah booking</h3>

      {recurring && (
        <div role="group" aria-label="Tanggal yang diubah" className="grid grid-cols-2 gap-1.5">
          <button type="button" aria-pressed={scope === 'one'} onClick={() => setScope('one')} className={toggleClass(scope === 'one')}>
            Hanya {formatDateShort(booking.booking_date)}
          </button>
          <button
            type="button"
            aria-pressed={scope === 'upcoming'}
            onClick={() => setScope('upcoming')}
            className={toggleClass(scope === 'upcoming')}
          >
            Ini dan sesudahnya
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-room" className={labelClass}>
            Ruangan
          </label>
          <select id="edit-room" value={roomId} onChange={(e) => setRoomId(Number(e.target.value))} className={fieldClass}>
            {bookable.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.max_people ? ` (maks ${r.max_people} orang)` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit-date" className={labelClass}>
            Tanggal
          </label>
          <input
            id="edit-date"
            type="date"
            value={scope === 'one' ? date : booking.booking_date}
            disabled={scope === 'upcoming'}
            onChange={(e) => setDate(e.target.value)}
            aria-describedby={scope === 'upcoming' ? 'edit-date-hint' : undefined}
            className={fieldClass}
          />
          {scope === 'upcoming' && (
            <p id="edit-date-hint" className="mt-1 text-xs text-gray-600">
              Tanggal tetap; ruangan dan jam berlaku untuk semua tanggal berikutnya.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="edit-start" className={labelClass}>
            Jam mulai
          </label>
          <select
            id="edit-start"
            value={isFullDay ? FULL_DAY : startTime}
            onChange={(e) => onStartChange(e.target.value)}
            className={`${fieldClass} tabular-nums`}
          >
            <option value={FULL_DAY}>
              Seharian ({ROOM_DAY_START}–{ROOM_DAY_END})
            </option>
            {TIMES.slice(0, -1).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit-end" className={labelClass}>
            Jam selesai
          </label>
          <select id="edit-end" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={`${fieldClass} tabular-nums`}>
            {TIMES.slice(1)
              .filter((t) => t > startTime)
              .map((t) => (
                <option key={t}>{t}</option>
              ))}
          </select>
        </div>
      </div>

      {/* Clash check */}
      <div className={`text-sm transition-opacity ${checking ? 'opacity-60' : ''}`} aria-live="polite">
        {!changed ? (
          <p className="text-gray-600">Ubah ruangan, tanggal, atau jam.</p>
        ) : current?.error ? (
          <p className="text-red-800">{current.error}</p>
        ) : !current ? (
          <p className="text-gray-600">Memeriksa jadwal…</p>
        ) : conflicts.length === 0 ? (
          <p className="text-blue-700">
            Jadwal baru kosong{current.count > 1 ? ` untuk ${current.count} tanggal` : ''}.
          </p>
        ) : (
          <div className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-amber-900">
            <p className="font-medium">
              Bentrok dengan {conflicts.length} booking. {booking.status === 'confirmed' ? 'Tanggal yang bentrok masuk daftar tunggu.' : ''}
            </p>
            <ul className="mt-1 space-y-0.5">
              {conflicts.slice(0, 5).map((c, i) => (
                <li key={i} className="tabular-nums">
                  {formatDateShort(c.booking_date)}, {c.start_time}–{c.end_time} · {c.agenda} ({c.borrower_name}, {c.department})
                </li>
              ))}
              {conflicts.length > 5 && <li>dan {conflicts.length - 5} lainnya</li>}
            </ul>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-900">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-gray-900" />
        Kirim email perubahan ke peminjam
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={pending || !changed || checking || !!current?.error}
          onClick={save}
          className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:bg-gray-300 disabled:text-gray-600"
        >
          {pending ? 'Menyimpan…' : conflicts.length && booking.status === 'confirmed' ? 'Simpan, masuk daftar tunggu' : 'Simpan perubahan'}
        </button>
        <button type="button" onClick={onBack} className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
          Kembali
        </button>
      </div>
    </div>
  )
}
