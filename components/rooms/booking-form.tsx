'use client'

import { useEffect, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { checkRoomSlots, createRoomReservation } from '@/lib/actions/room-actions'
import { DEPARTMENTS, ROOM_DAY_END, ROOM_DAY_START, ROOM_SLOT_MINUTES } from '@/lib/rooms/constants'
import {
  DAY_NAMES_SHORT,
  addMonthsClamped,
  formatDateShort,
  isoWeekday,
  minutesToTime,
  timeToMinutes,
} from '@/lib/rooms/dates'
import { describeRecurrence, type RecurrenceType } from '@/lib/rooms/recurrence'
import type { RebookDetails, Room, SlotCheck } from '@/lib/rooms/types'

const IDENTITY_KEY = 'invensa.room-borrower'
const subscribeNever = () => () => {}
const readSavedIdentity = () => {
  try {
    return localStorage.getItem(IDENTITY_KEY)
  } catch {
    return null
  }
}
const START = timeToMinutes(ROOM_DAY_START)
const END = timeToMinutes(ROOM_DAY_END)
const TIMES = Array.from({ length: (END - START) / ROOM_SLOT_MINUTES + 1 }, (_, i) => minutesToTime(START + i * ROOM_SLOT_MINUTES))

/** Input look without outer margin, for controls that sit in a row */
const fieldClass =
  'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm'
const inputClass = `mt-1.5 ${fieldClass}`
const labelClass = 'block text-sm font-medium text-gray-900'
const optional = <span className="font-normal text-gray-500">(opsional)</span>

/** Flat toggle button, same height as the inputs */
const toggleClass = (on: boolean) =>
  `h-10 min-w-0 rounded-md px-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${
    on ? 'bg-gray-900 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  }`

const REPEAT_OPTIONS: [RecurrenceType, string][] = [
  ['none', 'Sekali'],
  ['daily', 'Harian'],
  ['weekly', 'Mingguan'],
  ['monthly', 'Bulanan'],
]

/** Lets the calendar on the same page fill the form: an empty slot, or "Booking ulang" on a booking. */
export interface BookingFormHandle {
  fill: (slot: { roomId?: number | null; date: string; start?: string }) => void
  /** copies every detail of an earlier booking except its date */
  rebook: (details: RebookDetails) => void
}

type Prefill = {
  roomId: number | null
  date: string
  start: string | null
  /** from ?rebook=<booking id>: fill everything except the date */
  rebook?: RebookDetails & { bookingId: number }
}

interface Props {
  rooms: Room[]
  today: string
  isAdmin: boolean
  /** room, date and time from a link (?book_room=&book_date=&start=), or null */
  prefill: Prefill | null
  ref?: React.Ref<BookingFormHandle>
}

export function BookingForm({ rooms, today, isAdmin, prefill, ref }: Props) {
  const initial: Prefill = prefill ?? { roomId: null, date: today, start: null }
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Slot
  const [roomId, setRoomId] = useState<number | ''>(initial.roomId ?? '')
  const [date, setDate] = useState(initial.date)
  const initialStart = initial.start && TIMES.includes(initial.start) && initial.start < ROOM_DAY_END ? initial.start : '09:00'
  const [startTime, setStartTime] = useState(initialStart)
  const [endTime, setEndTime] = useState(minutesToTime(Math.min(END, timeToMinutes(initialStart) + 60)))

  // Recurrence
  const [recType, setRecType] = useState<RecurrenceType>('none')
  const [weekdays, setWeekdays] = useState<number[]>([isoWeekday(initial.date)])
  const [skipWeekends, setSkipWeekends] = useState(true)
  const [endType, setEndType] = useState<'until' | 'count'>('until')
  const [until, setUntil] = useState(addMonthsClamped(initial.date, 1))
  const [count, setCount] = useState(4)

  // Borrower
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [agenda, setAgenda] = useState('')
  const [participants, setParticipants] = useState('')
  const [peopleCount, setPeopleCount] = useState('')
  const [notes, setNotes] = useState('')

  const [error, setError] = useState<string | null>(null)

  // Details saved on this device by the last booking (read-only snapshot; empty on the server)
  const savedRaw = useSyncExternalStore(subscribeNever, readSavedIdentity, () => null)
  const saved = useMemo(() => {
    try {
      return savedRaw ? (JSON.parse(savedRaw) as { name?: string; department?: string; phone?: string; email?: string }) : null
    } catch {
      return null
    }
  }, [savedRaw])
  const fillSaved = () => {
    if (!saved) return
    setName(saved.name ?? '')
    setDepartment(saved.department ?? '')
    setPhone(saved.phone ?? '')
    setEmail(saved.email ?? '')
  }

  const FULL_DAY = 'full'
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

  const onDateChange = (v: string) => {
    setDate(v)
    if (v && weekdays.length === 1) setWeekdays([isoWeekday(v)])
    if (v && until < v) setUntil(addMonthsClamped(v, 1))
  }

  const fill = ({ roomId: r, date: d, start }: { roomId?: number | null; date: string; start?: string | null }) => {
    if (r && rooms.some((x) => x.id === r)) setRoomId(r)
    onDateChange(d)
    if (start && TIMES.includes(start) && start < ROOM_DAY_END) {
      setStartTime(start)
      setEndTime(minutesToTime(Math.min(END, timeToMinutes(start) + 60)))
    }
  }
  const rebook = (d: RebookDetails) => {
    if (rooms.some((x) => x.id === d.roomId)) setRoomId(d.roomId)
    if (TIMES.includes(d.startTime) && TIMES.includes(d.endTime) && d.endTime > d.startTime) {
      setStartTime(d.startTime)
      setEndTime(d.endTime)
    }
    setName(d.borrowerName)
    setDepartment(d.department)
    setPhone(d.phoneNumber)
    setEmail(d.email ?? '')
    setAgenda(d.agenda)
    setParticipants(d.participants ?? '')
    setPeopleCount(d.peopleCount ? String(d.peopleCount) : '')
    setNotes(d.notes ?? '')
    // Same repeat pattern; the end is counted again from the new start date
    setRecType(d.recurrence.type)
    if (d.recurrence.weekdays?.length) setWeekdays(d.recurrence.weekdays.map(Number))
    setSkipWeekends(d.recurrence.skipWeekends ?? true)
    if (d.recurrence.count) {
      setEndType('count')
      setCount(d.recurrence.count)
    } else {
      setEndType('until')
      setUntil(addMonthsClamped(date, 1))
    }
    setError(null)
  }
  useImperativeHandle(ref, () => ({ fill, rebook }))

  // A new link prefill (same page, new query) updates the fields and keeps what was typed.
  // A rebook link applies on first render too.
  const prefillKey = prefill ? `${prefill.roomId}|${prefill.date}|${prefill.start}|${prefill.rebook?.bookingId ?? ''}` : ''
  const [appliedKey, setAppliedKey] = useState(prefill?.rebook ? '' : prefillKey)
  if (prefill && prefillKey !== appliedKey) {
    setAppliedKey(prefillKey)
    if (prefill.rebook) rebook(prefill.rebook)
    else fill(prefill)
  }

  const room = rooms.find((r) => r.id === roomId)
  const recurrence = useMemo(
    () => ({ type: recType, weekdays, skipWeekends, endType, until, count }),
    [recType, weekdays, skipWeekends, endType, until, count]
  )

  // Live availability, debounced. Each result remembers which input it answers.
  const checkKey = roomId ? JSON.stringify([roomId, date, startTime, endTime, recurrence]) : ''
  const [result, setResult] = useState<{ key: string; error?: string; slots: SlotCheck[] }>({ key: '', slots: [] })
  const latestKey = useRef('')
  useEffect(() => {
    latestKey.current = checkKey
    if (!checkKey || !roomId) return
    const t = setTimeout(async () => {
      const res = await checkRoomSlots({ roomId, date, startTime, endTime, recurrence })
      if (latestKey.current === checkKey) setResult({ key: checkKey, error: res.error, slots: res.slots })
    }, 350)
    return () => clearTimeout(t)
  }, [checkKey, roomId, date, startTime, endTime, recurrence])
  const check = {
    loading: !!checkKey && result.key !== checkKey,
    error: result.key === checkKey ? result.error : undefined,
    slots: result.slots,
  }

  const toggleWeekday = (d: number) =>
    setWeekdays((cur) => (cur.includes(d) ? (cur.length > 1 ? cur.filter((x) => x !== d) : cur) : [...cur, d].sort()))

  const free = check.slots.filter((s) => s.status === 'free').length
  const waiting = check.slots.filter((s) => s.status === 'waitlist').length
  const overCapacity = room?.max_people && Number(peopleCount) > room.max_people
  const repeating = recType !== 'none'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!roomId) {
      setError('Pilih ruangan')
      return
    }
    startTransition(async () => {
      const res = await createRoomReservation({
        roomId,
        date,
        startTime,
        endTime,
        recurrence,
        borrowerName: name,
        department,
        phoneNumber: phone,
        email,
        agenda,
        participants,
        peopleCount: peopleCount ? Number(peopleCount) : null,
        notes,
      })
      if (res.error !== undefined) {
        setError(res.error)
        toast.error(res.error)
        return
      }
      try {
        localStorage.setItem(IDENTITY_KEY, JSON.stringify({ name, department, phone, email }))
      } catch {
        /* storage unavailable */
      }
      router.push(`/rooms/booking/${res.token}?baru=1`)
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      {saved?.name && saved.name !== name && (
        <p className="text-sm text-gray-700 sm:col-span-2">
          <button type="button" onClick={fillSaved} className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600">
            Pakai data terakhir
          </button>{' '}
          ({saved.name}
          {saved.department ? ` · ${saved.department}` : ''})
        </p>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          Nama lengkap
        </label>
        <input id="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="department" className={labelClass}>
          Departemen penyelenggara
        </label>
        <input
          id="department"
          required
          list="departments"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={inputClass}
        />
        <datalist id="departments">
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>
          Nomor WhatsApp
        </label>
        <input
          id="phone"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08123456789"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby="email-hint"
          className={inputClass}
        />
        <p id="email-hint" className="mt-1 text-xs text-gray-600">
          Link untuk membatalkan booking dikirim ke sini.
        </p>
      </div>

      <div>
        <label htmlFor="agenda" className={labelClass}>
          Nama agenda
        </label>
        <input id="agenda" required value={agenda} onChange={(e) => setAgenda(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="participants" className={labelClass}>
          Dept. peserta {optional}
        </label>
        <input id="participants" value={participants} onChange={(e) => setParticipants(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label htmlFor="room" className={labelClass}>
          Ruangan
        </label>
        <select
          id="room"
          required
          value={roomId}
          onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : '')}
          className={inputClass}
        >
          <option value="">Pilih ruangan</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.max_people ? ` (maks ${r.max_people} orang)` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="people" className={labelClass}>
          Jumlah orang {optional}
        </label>
        <input
          id="people"
          type="number"
          min={1}
          value={peopleCount}
          onChange={(e) => setPeopleCount(e.target.value)}
          aria-describedby={overCapacity ? 'people-hint' : undefined}
          className={`${inputClass} tabular-nums`}
        />
        {overCapacity && (
          <p id="people-hint" className="mt-1 text-xs font-medium text-amber-800">
            Melebihi kapasitas {room?.name} (maks {room?.max_people} orang)
          </p>
        )}
      </div>

      <div>
        <label htmlFor="date" className={labelClass}>
          {repeating ? 'Tanggal mulai' : 'Tanggal'}
        </label>
        <input
          id="date"
          type="date"
          required
          min={isAdmin ? undefined : today}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="start" className={labelClass}>
            Jam mulai
          </label>
          <select
            id="start"
            value={isFullDay ? FULL_DAY : startTime}
            onChange={(e) => onStartChange(e.target.value)}
            className={`${inputClass} tabular-nums`}
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
          <label htmlFor="end" className={labelClass}>
            Jam selesai
          </label>
          <select id="end" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={`${inputClass} tabular-nums`}>
            {TIMES.slice(1)
              .filter((t) => t > startTime)
              .map((t) => (
                <option key={t}>{t}</option>
              ))}
          </select>
        </div>
      </div>

      <div className="sm:col-span-2">
        <p id="repeat-label" className={labelClass}>
          Pengulangan
        </p>
        <div role="group" aria-labelledby="repeat-label" className="mt-1.5 grid grid-cols-4 gap-1.5 sm:w-[calc(50%-10px)]">
          {REPEAT_OPTIONS.map(([v, label]) => {
            const on = recType === v
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                aria-controls="repeat-options"
                onClick={() => setRecType(v)}
                className={toggleClass(on)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Repeat options open under the selector for the chosen type */}
      <div
        id="repeat-options"
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none sm:col-span-2 ${
          repeating ? 'grid-rows-[1fr]' : '-mt-4 grid-rows-[0fr]' /* cancel the grid gap while closed */
        }`}
        aria-hidden={!repeating}
        inert={!repeating}
      >
        {/* Padding keeps focus rings visible inside the clipping wrapper */}
        <div className="-mx-1 overflow-hidden px-1 pb-1">
          <div className="grid gap-x-5 gap-y-4 pt-1 sm:grid-cols-2">
            {/* Left column: which days */}
            <div>
              <p id="repeat-days-label" className={labelClass}>
                {recType === 'weekly' ? 'Setiap hari' : recType === 'monthly' ? 'Setiap bulan' : 'Hari'}
              </p>
              {recType === 'weekly' ? (
                <div role="group" aria-labelledby="repeat-days-label" className="mt-1.5 grid h-10 grid-cols-7 gap-1.5">
                  {DAY_NAMES_SHORT.map((n, i) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={weekdays.includes(i + 1)}
                      onClick={() => toggleWeekday(i + 1)}
                      className={toggleClass(weekdays.includes(i + 1))}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : recType === 'monthly' ? (
                <p className="mt-1.5 flex h-10 items-center rounded-md bg-gray-100 px-3 text-sm text-gray-900">
                  Tanggal {Number(date.slice(8, 10))}
                  <span className="ml-1 text-gray-500">(ikut tanggal mulai)</span>
                </p>
              ) : (
                <div role="group" aria-labelledby="repeat-days-label" className="mt-1.5 grid h-10 grid-cols-2 gap-1.5">
                  <button type="button" aria-pressed={!skipWeekends} onClick={() => setSkipWeekends(false)} className={toggleClass(!skipWeekends)}>
                    Setiap hari
                  </button>
                  <button type="button" aria-pressed={skipWeekends} onClick={() => setSkipWeekends(true)} className={toggleClass(skipWeekends)}>
                    Hari kerja (Sen–Jum)
                  </button>
                </div>
              )}
            </div>

            {/* Right column: when it ends */}
            <div>
              <p id="repeat-end-label" className={labelClass}>
                Berakhir
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
                <button
                  type="button"
                  aria-pressed={endType === 'until'}
                  aria-describedby="repeat-end-label"
                  onClick={() => setEndType('until')}
                  className={toggleClass(endType === 'until')}
                >
                  Sampai
                </button>
                <button
                  type="button"
                  aria-pressed={endType === 'count'}
                  aria-describedby="repeat-end-label"
                  onClick={() => setEndType('count')}
                  className={toggleClass(endType === 'count')}
                >
                  Sebanyak
                </button>
                {endType === 'until' ? (
                  <input
                    type="date"
                    aria-label="Tanggal akhir pengulangan"
                    value={until}
                    min={date}
                    onChange={(e) => setUntil(e.target.value)}
                    className={`${fieldClass} col-span-2 min-w-0 lg:col-span-1`}
                  />
                ) : (
                  <div className="relative col-span-2 lg:col-span-1">
                    <input
                      type="number"
                      aria-label="Jumlah pengulangan"
                      min={1}
                      max={100}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className={`${fieldClass} pr-10 tabular-nums`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">kali</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {repeating && (
            <p className="mt-2 text-sm text-gray-600">
              {describeRecurrence(recurrence, date)}.
              {recType === 'monthly' && Number(date.slice(8, 10)) > 28 &&
                ` Bulan tanpa tanggal ${Number(date.slice(8, 10))} memakai hari terakhirnya.`}
            </p>
          )}
        </div>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="notes" className={labelClass}>
          Catatan {optional}
        </label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} h-auto py-2`} />
      </div>

      <div className="sm:col-span-2">
        <Availability roomName={room?.name} check={check} free={free} waiting={waiting} repeating={repeating} />
        {error && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !!check.error}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-gray-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 active:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-600"
        >
          {pending ? 'Menyimpan…' : waiting && !free ? 'Booking (masuk daftar tunggu)' : 'Booking ruangan sekarang'}
        </button>
      </div>
    </form>
  )
}

/** One line of availability; repeating bookings can open the per-date list. */
function Availability({
  roomName,
  check,
  free,
  waiting,
  repeating,
}: {
  roomName?: string
  check: { loading: boolean; error?: string; slots: SlotCheck[] }
  free: number
  waiting: number
  repeating: boolean
}) {
  if (!roomName) return <p className="text-sm text-gray-600">Pilih ruangan untuk melihat apakah jamnya kosong.</p>
  if (check.error) return <p className="text-sm text-red-800">{check.error}</p>
  if (!check.slots.length) return <p className="text-sm text-gray-600">Memeriksa jadwal…</p>

  const total = check.slots.length
  const conflicts = check.slots.flatMap((s) => s.conflicts.map((c) => ({ ...c, date: s.date })))

  return (
    <div className={`text-sm transition-opacity ${check.loading ? 'opacity-60' : ''}`} aria-live="polite">
      <p className="text-gray-900">
        {total === 1 ? (
          waiting ? (
            <span className="text-amber-800">
              Jam ini sudah terisi ({conflicts.map((c) => `${c.start_time}–${c.end_time} ${c.agenda}`).join(', ')}). Booking
              Anda masuk daftar tunggu.
            </span>
          ) : (
            <span className="text-blue-700">{roomName} kosong di jam ini.</span>
          )
        ) : waiting === 0 ? (
          <span className="text-blue-700">Semua {total} tanggal kosong.</span>
        ) : (
          <>
            <span className="tabular-nums">{total}</span> tanggal: <span className="tabular-nums">{free}</span> kosong,{' '}
            <span className="text-amber-800 tabular-nums">{waiting} masuk daftar tunggu</span>.
          </>
        )}
      </p>
      {repeating && total > 1 && (
        <details className="mt-1">
          <summary className="cursor-pointer text-gray-700 hover:text-gray-900">Lihat tanggal</summary>
          <ul className="mt-2 max-h-56 overflow-y-auto">
            {check.slots.map((s) => (
              <li key={s.date} className="flex flex-wrap justify-between gap-x-4 border-t border-gray-100 py-1.5 first:border-t-0">
                <span className="text-gray-900">{formatDateShort(s.date, true)}</span>
                {s.status === 'free' ? (
                  <span className="text-blue-700">Kosong</span>
                ) : (
                  <span className="text-amber-800 tabular-nums">
                    Daftar tunggu · terisi {s.conflicts.map((c) => `${c.start_time}–${c.end_time} ${c.agenda}`).join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
