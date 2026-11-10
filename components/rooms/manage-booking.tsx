'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cancelBookingsByToken, type ManagedReservation } from '@/lib/actions/room-actions'
import { formatDateShort } from '@/lib/rooms/dates'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Booking = ManagedReservation['bookings'][number]

function statusText(b: Booking) {
  if (b.status === 'confirmed') return 'Terkonfirmasi'
  if (b.status === 'waitlisted') return b.waitlist_position ? `Daftar tunggu, antrean ${b.waitlist_position}` : 'Daftar tunggu'
  return b.cancelled_by === 'admin' ? 'Dibatalkan admin' : 'Dibatalkan'
}

export function ManageBooking({ token, bookings, today }: { token: string; bookings: Booking[]; today: string }) {
  const router = useRouter()
  const [selected, setSelected] = useState<number[]>([])
  const [confirm, setConfirm] = useState<null | 'selected' | 'upcoming'>(null)
  const [pending, startTransition] = useTransition()

  const cancellable = bookings.filter((b) => b.status !== 'cancelled' && b.booking_date >= today)
  const allSelected = cancellable.length > 0 && selected.length === cancellable.length

  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const run = () => {
    const target = confirm
    setConfirm(null)
    startTransition(async () => {
      const res = await cancelBookingsByToken(token, target === 'upcoming' ? 'upcoming' : selected)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${res.cancelled} tanggal dibatalkan`)
      setSelected([])
      router.refresh()
    })
  }

  const count = confirm === 'upcoming' ? cancellable.length : selected.length

  return (
    <section aria-labelledby="dates-title" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="dates-title" className="text-lg font-semibold text-gray-900">
          Tanggal <span className="font-normal text-gray-500 tabular-nums">({bookings.length})</span>
        </h2>
        {cancellable.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!selected.length || pending}
              onClick={() => setConfirm('selected')}
              className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:text-gray-500 disabled:hover:bg-white"
            >
              Batalkan terpilih{selected.length ? ` (${selected.length})` : ''}
            </button>
            {cancellable.length > 1 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirm('upcoming')}
                className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Batalkan semua yang akan datang
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th scope="col" className="w-10 px-4 py-2.5 font-normal">
                {cancellable.length > 0 && (
                  <input
                    type="checkbox"
                    aria-label="Pilih semua yang bisa dibatalkan"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? [] : cancellable.map((b) => b.id))}
                    className="h-4 w-4 accent-gray-900"
                  />
                )}
              </th>
              <th scope="col" className="px-2 py-2.5 font-normal">Tanggal</th>
              <th scope="col" className="px-2 py-2.5 font-normal">Jam</th>
              <th scope="col" className="px-2 py-2.5 font-normal">Ruangan</th>
              <th scope="col" className="px-4 py-2.5 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const canCancel = b.status !== 'cancelled' && b.booking_date >= today
              const past = b.booking_date < today
              return (
                <tr key={b.id} className={`border-b border-gray-100 last:border-b-0 ${past || b.status === 'cancelled' ? 'text-gray-500' : 'text-gray-900'}`}>
                  <td className="px-4 py-2.5">
                    {canCancel && (
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${formatDateShort(b.booking_date, true)}`}
                        checked={selected.includes(b.id)}
                        onChange={() => toggle(b.id)}
                        className="h-4 w-4 accent-gray-900"
                      />
                    )}
                  </td>
                  <td className="px-2 py-2.5">{formatDateShort(b.booking_date, true)}</td>
                  <td className="px-2 py-2.5 tabular-nums">
                    {b.start_time}–{b.end_time}
                  </td>
                  <td className="px-2 py-2.5">{b.room_name}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        b.status === 'confirmed'
                          ? 'text-blue-700'
                          : b.status === 'waitlisted'
                            ? 'text-amber-800'
                            : 'text-gray-500 line-through decoration-gray-300'
                      }
                    >
                      {statusText(b)}
                    </span>
                    {past && b.status !== 'cancelled' && <span className="text-gray-500"> · selesai</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan {count} tanggal?</AlertDialogTitle>
            <AlertDialogDescription>
              Ruangan dilepas untuk peminjam lain. Pembatalan tidak bisa diurungkan; untuk memakai lagi, buat booking baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={run} className="bg-red-700 text-white hover:bg-red-800">
              Ya, batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
