'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { BookingFacts, type DateRange } from '@/components/rooms/room-calendar'
import { adminCancelBooking, adminPromoteBooking, getSlotCandidates } from '@/lib/actions/room-admin-actions'
import { formatDateShort, whatsappLink } from '@/lib/rooms/dates'
import type { CalendarBooking, Room } from '@/lib/rooms/types'
import { EditBookingForm } from './edit-booking-form'

type Candidate = Awaited<ReturnType<typeof getSlotCandidates>>[number]

interface Props {
  booking: CalendarBooking | null
  roomName: string
  onClose: () => void
  /** waitlisted booking to pick by default after cancelling this one */
  preselectPromoteId?: number | null
  /** rooms the booking can be moved to */
  rooms: Room[]
  /** consecutive days merged in the calendar; actions still start from the clicked booking's first date */
  range?: DateRange
}

export function Contact({ name, phone, email }: { name: string; phone?: string | null; email?: string | null }) {
  const wa = whatsappLink(phone)
  return (
    <span className="text-sm">
      {wa ? (
        <a href={wa} target="_blank" rel="noreferrer" className="font-medium text-gray-900 underline underline-offset-4 hover:text-blue-700">
          WhatsApp {name.split(' ')[0]}
        </a>
      ) : (
        <span className="text-gray-500">Tanpa nomor</span>
      )}
      {phone && <span className="text-gray-600 tabular-nums"> · {phone}</span>}
      {email && (
        <>
          {' · '}
          <a href={`mailto:${email}`} className="text-gray-600 hover:text-gray-900 hover:underline">
            {email}
          </a>
        </>
      )}
    </span>
  )
}

/** Remounts per booking so every open starts from a clean form. */
export function BookingActionsModal(props: Props) {
  if (!props.booking) return null
  return <BookingActions key={`${props.booking.id}-${props.preselectPromoteId ?? ''}`} {...props} booking={props.booking} />
}

function BookingActions({
  booking,
  roomName,
  onClose,
  preselectPromoteId,
  rooms,
  range,
}: Props & { booking: CalendarBooking }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<'view' | 'cancel' | 'edit'>(preselectPromoteId ? 'cancel' : 'view')
  const [scope, setScope] = useState<'one' | 'upcoming'>('one')
  const [reason, setReason] = useState('')
  const [notify, setNotify] = useState(true)
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [promoteId, setPromoteId] = useState<number | null>(null)

  useEffect(() => {
    if (booking.status !== 'confirmed') return
    let alive = true
    getSlotCandidates(booking.id).then((list) => {
      if (!alive) return
      setCandidates(list)
      const pre = list.find((c) => c.booking.id === preselectPromoteId && c.otherBlockers === 0)
      const first = list.find((c) => c.otherBlockers === 0)
      setPromoteId(pre?.booking.id ?? first?.booking.id ?? null)
    })
    return () => {
      alive = false
    }
  }, [booking.id, booking.status, preselectPromoteId])

  const done = (msg: string) => {
    toast.success(msg)
    onClose()
    router.refresh()
  }

  const promote = () =>
    startTransition(async () => {
      const res = await adminPromoteBooking(booking.id)
      if (res.error) toast.error(res.error)
      else done('Booking dikonfirmasi')
    })

  const cancel = () =>
    startTransition(async () => {
      const res = await adminCancelBooking({
        bookingId: booking.id,
        scope,
        reason,
        notify,
        promoteId: scope === 'one' ? promoteId : null,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.promoteError) toast.error(`Dibatalkan, tapi konfirmasi gagal: ${res.promoteError}`)
      done(res.promoted ? `${res.cancelled} dibatalkan, daftar tunggu dikonfirmasi` : `${res.cancelled} tanggal dibatalkan`)
    })

  const past = booking.status === 'cancelled'

  return (
    <Modal open onClose={onClose} title={booking.agenda} width="max-w-xl">
      <BookingFacts booking={booking} roomName={roomName} range={range} />
      <div className="mt-3 grid grid-cols-[96px_1fr] gap-x-4 text-sm">
        <span className="text-gray-500">Kontak</span>
        <Contact name={booking.borrower_name} phone={booking.phone_number} email={booking.email} />
      </div>
      {booking.notes && (
        <div className="mt-2 grid grid-cols-[96px_1fr] gap-x-4 text-sm">
          <span className="text-gray-500">Catatan</span>
          <p className="whitespace-pre-line text-gray-900">{booking.notes}</p>
        </div>
      )}
      {booking.manage_token && (
        <div className="mt-2 grid grid-cols-[96px_1fr] gap-x-4 text-sm">
          <span className="text-gray-500">Semua tanggal</span>
          <a href={`/rooms/booking/${booking.manage_token}`} target="_blank" rel="noreferrer" className="text-gray-900 underline underline-offset-4">
            Buka halaman booking
          </a>
        </div>
      )}

      {!past && mode === 'view' && (
        <div className="mt-6 flex flex-wrap gap-2">
          {booking.status === 'waitlisted' && (
            <button
              type="button"
              disabled={pending}
              onClick={promote}
              className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:bg-gray-300"
            >
              Konfirmasi
            </button>
          )}
          <a
            href={`/rooms?rebook=${booking.id}#booking`}
            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Booking ulang
          </a>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Ubah
          </button>
          <button
            type="button"
            onClick={() => setMode('cancel')}
            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Batalkan booking
          </button>
        </div>
      )}

      {!past && mode === 'edit' && (
        <EditBookingForm booking={booking} rooms={rooms} onDone={done} onBack={() => setMode('view')} />
      )}

      {!past && mode === 'cancel' && (
        <div className="mt-6 space-y-4 border-t border-gray-200 pt-5">
          <h3 className="text-sm font-semibold text-gray-900">Batalkan booking</h3>

          {booking.recurrence_type !== 'none' && (
            <fieldset className="space-y-2 text-sm">
              <legend className="sr-only">Cakupan pembatalan</legend>
              <label className="flex items-center gap-2">
                <input type="radio" checked={scope === 'one'} onChange={() => setScope('one')} className="h-4 w-4 accent-gray-900" />
                Hanya {formatDateShort(booking.booking_date)}
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={scope === 'upcoming'} onChange={() => setScope('upcoming')} className="h-4 w-4 accent-gray-900" />
                Tanggal ini dan semua sesudahnya
              </label>
            </fieldset>
          )}

          <div>
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-900">
              Alasan <span className="font-normal text-gray-500">(opsional, ikut di email)</span>
            </label>
            <input
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Agenda tidak jadi"
              className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-900">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-gray-900" />
            Kirim email ke peminjam
          </label>

          {booking.status === 'confirmed' && scope === 'one' && (
            <div>
              <p className="text-sm font-medium text-gray-900">Lalu konfirmasi dari daftar tunggu</p>
              {candidates === null ? (
                <p className="mt-2 text-sm text-gray-500">Memuat…</p>
              ) : candidates.length === 0 ? (
                <p className="mt-2 text-sm text-gray-600">Tidak ada yang menunggu jam ini.</p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
                  {candidates.map((c, i) => {
                    const blocked = c.otherBlockers > 0
                    return (
                      <li key={c.booking.id} className="px-3 py-2.5">
                        <label className={`flex gap-3 ${blocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="radio"
                            name="promote"
                            disabled={blocked}
                            checked={promoteId === c.booking.id}
                            onChange={() => setPromoteId(c.booking.id)}
                            className="mt-1 h-4 w-4 accent-gray-900"
                          />
                          <span className="min-w-0 text-sm">
                            <span className="font-medium text-gray-900">
                              {i + 1}. {c.booking.borrower_name}
                            </span>
                            <span className="text-gray-600"> · {c.booking.department}</span>
                            <span className="block text-gray-700 tabular-nums">
                              {c.booking.start_time}–{c.booking.end_time} · {c.booking.agenda}
                            </span>
                            {blocked && <span className="block text-xs text-amber-800">Masih bentrok dengan booking lain</span>}
                          </span>
                        </label>
                        <div className="ml-7 mt-1">
                          <Contact name={c.booking.borrower_name} phone={c.booking.phone_number} />
                        </div>
                      </li>
                    )
                  })}
                  <li className="px-3 py-2.5">
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="promote"
                        checked={promoteId === null}
                        onChange={() => setPromoteId(null)}
                        className="h-4 w-4 accent-gray-900"
                      />
                      Jangan konfirmasi siapa pun dulu
                    </label>
                  </li>
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={cancel}
              className="inline-flex h-9 items-center rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:bg-gray-300"
            >
              {pending ? 'Memproses…' : promoteId && scope === 'one' && booking.status === 'confirmed' ? 'Batalkan dan konfirmasi' : 'Batalkan booking'}
            </button>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
