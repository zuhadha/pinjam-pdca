'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarSearch, X } from 'lucide-react'
import { getPublicRooms, searchRoomAgendas, type RoomAgendaOption } from '@/lib/actions/room-actions'
import { formatDateShort } from '@/lib/rooms/dates'
import type { Room } from '@/lib/rooms/types'

const fieldClass =
  'h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

interface Props {
  /** called with the chosen room booking; the form copies its date, time, room and agenda */
  onPick: (agenda: RoomAgendaOption) => void
}

/**
 * "Ambil dari booking ruangan": search confirmed room bookings by agenda name,
 * narrow by date or room, and copy the chosen one into the borrow form.
 */
export function RoomAgendaPicker({ onPick }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [date, setDate] = useState('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [rooms, setRooms] = useState<Room[]>([])
  const [result, setResult] = useState<{ key: string; items: RoomAgendaOption[] }>({ key: '', items: [] })
  const [picked, setPicked] = useState<RoomAgendaOption | null>(null)
  const latestKey = useRef('')
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Rooms for the filter, loaded once on first open
  useEffect(() => {
    if (!open || rooms.length) return
    let alive = true
    getPublicRooms({ includeMaintenance: true }).then((r) => alive && setRooms(r))
    return () => {
      alive = false
    }
  }, [open, rooms.length])

  // Search, debounced while typing
  const key = open ? JSON.stringify([q.trim(), date, roomId]) : ''
  useEffect(() => {
    latestKey.current = key
    if (!key) return
    const t = setTimeout(async () => {
      const items = await searchRoomAgendas({ q, date: date || null, roomId: roomId || null })
      if (latestKey.current === key) setResult({ key, items })
    }, 250)
    return () => clearTimeout(t)
  }, [key, q, date, roomId])
  const loading = !!key && result.key !== key

  // Close on Escape or a click outside the panel
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const toggle = () => {
    setOpen((o) => !o)
    setTimeout(() => searchRef.current?.focus(), 0)
  }

  const choose = (a: RoomAgendaOption) => {
    setPicked(a)
    onPick(a)
    setOpen(false)
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="room-agenda-panel"
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <CalendarSearch className="h-4 w-4" aria-hidden />
        Ambil dari booking ruangan
      </button>
      {picked && !open && (
        <p className="mt-1.5 text-xs text-gray-600">
          Diisi dari: <span className="font-medium text-gray-900">{picked.agenda}</span> · {formatDateShort(picked.booking_date)},{' '}
          {picked.start_time}–{picked.end_time} · {picked.room_name}
        </p>
      )}

      {open && (
        <div
          id="room-agenda-panel"
          className="absolute inset-x-0 z-50 mt-1 rounded-md border border-gray-200 bg-white p-3 shadow-lg"
        >
          <div className="relative">
            <label htmlFor="agenda-search" className="sr-only">
              Cari nama agenda
            </label>
            <input
              ref={searchRef}
              id="agenda-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama agenda…"
              autoComplete="off"
              className={`${fieldClass} pr-9`}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Hapus pencarian"
                className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="agenda-date" className="sr-only">
                Filter tanggal
              </label>
              <input id="agenda-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="agenda-room" className="sr-only">
                Filter ruangan
              </label>
              <select
                id="agenda-room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : '')}
                className={fieldClass}
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
          <p className="mt-2 text-xs text-gray-500">
            {date ? `Booking pada ${formatDateShort(date, true)}` : 'Booking 60 hari ke depan'}
            {date && (
              <button type="button" onClick={() => setDate('')} className="ml-2 font-medium text-gray-700 underline underline-offset-2">
                Semua tanggal
              </button>
            )}
          </p>

          <ul
            role="listbox"
            aria-label="Booking ruangan"
            aria-busy={loading}
            className={`mt-2 max-h-64 overflow-y-auto transition-opacity ${loading ? 'opacity-60' : ''}`}
          >
            {result.items.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-gray-600">
                {loading ? 'Mencari…' : 'Tidak ada booking yang cocok.'}
              </li>
            ) : (
              result.items.map((a) => (
                <li key={a.id} role="option" aria-selected={picked?.id === a.id}>
                  <button
                    type="button"
                    onClick={() => choose(a)}
                    className="w-full rounded px-2 py-2 text-left hover:bg-primary-50 focus-visible:bg-primary-50 focus-visible:outline-none"
                  >
                    <span className="block text-sm font-medium text-gray-900">{a.agenda}</span>
                    <span className="block text-xs text-gray-600 tabular-nums">
                      {formatDateShort(a.booking_date)} · {a.start_time}–{a.end_time} · {a.room_name} · {a.department}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
