'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { adminPromoteBooking, type WaitlistEntry } from '@/lib/actions/room-admin-actions'
import { formatDateShort } from '@/lib/rooms/dates'
import type { CalendarBooking, Room } from '@/lib/rooms/types'
import { BookingActionsModal, Contact } from './booking-actions-modal'

const VISIBLE = 6

export function WaitlistPanel({ entries, rooms }: { entries: WaitlistEntry[]; rooms: Room[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [modal, setModal] = useState<{ booking: CalendarBooking; roomName: string; promoteId?: number } | null>(null)

  const promote = (id: number) => {
    setBusyId(id)
    startTransition(async () => {
      const res = await adminPromoteBooking(id)
      setBusyId(null)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Booking dikonfirmasi')
        router.refresh()
      }
    })
  }

  const list = showAll ? entries : entries.slice(0, VISIBLE)

  return (
    <section aria-labelledby="waitlist-title" className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 pb-3">
        <h2 id="waitlist-title" className="text-base font-semibold text-gray-900">
          Daftar tunggu <span className="font-normal text-gray-500 tabular-nums">({entries.length})</span>
        </h2>
        <p className="text-sm text-gray-600">Hubungi peminjam yang terkonfirmasi. Bila agenda batal, batalkan lalu pilih penggantinya.</p>
      </div>

      {entries.length === 0 ? (
        <p className="border-t border-gray-100 px-5 py-8 text-sm text-gray-600">
          Tidak ada yang menunggu. Booking yang bentrok dengan jadwal terkonfirmasi muncul di sini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-y border-gray-200 text-left text-xs text-gray-500">
                <th scope="col" className="px-5 py-2.5 font-normal">Tanggal</th>
                <th scope="col" className="px-3 py-2.5 font-normal">Menunggu</th>
                <th scope="col" className="px-3 py-2.5 font-normal">Di belakang</th>
                <th scope="col" className="px-5 py-2.5 text-right font-normal">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {list.map(({ booking: w, room_name, position, blockers }) => (
                <tr key={w.id} className="border-b border-gray-100 align-top last:border-b-0">
                  <td className="whitespace-nowrap px-5 py-3">
                    <p className="font-medium text-gray-900">{formatDateShort(w.booking_date)}</p>
                    <p className="text-gray-600 tabular-nums">
                      {w.start_time}–{w.end_time}
                    </p>
                    <p className="text-gray-600">{room_name}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-gray-900">
                      <span className="font-medium">{w.borrower_name}</span>
                      <span className="text-gray-600"> · {w.department}</span>
                    </p>
                    <p className="text-gray-700">{w.agenda}</p>
                    <p className="text-xs text-gray-500 tabular-nums">Antrean {position}</p>
                    <div className="mt-1">
                      <Contact name={w.borrower_name} phone={w.phone_number} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {blockers.length === 0 ? (
                      <p className="font-medium text-blue-700">Jam ini sudah kosong</p>
                    ) : (
                      blockers.map((b) => (
                        <div key={b.id} className="mb-2 last:mb-0">
                          <button
                            type="button"
                            onClick={() => setModal({ booking: b, roomName: room_name, promoteId: w.id })}
                            className="text-left text-gray-900 underline-offset-4 hover:underline"
                          >
                            <span className="font-medium">{b.borrower_name}</span>
                            <span className="text-gray-600"> · {b.department}</span>
                          </button>
                          <p className="text-gray-700">
                            <span className="tabular-nums">
                              {b.start_time}–{b.end_time}
                            </span>{' '}
                            · {b.agenda}
                          </p>
                          <Contact name={b.borrower_name} phone={b.phone_number} />
                        </div>
                      ))
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col items-end gap-1.5">
                      {blockers.length === 0 ? (
                        <button
                          type="button"
                          disabled={pending && busyId === w.id}
                          onClick={() => promote(w.id)}
                          className="inline-flex h-8 items-center rounded-md bg-gray-900 px-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:bg-gray-300"
                        >
                          Konfirmasi
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setModal({ booking: blockers[0], roomName: room_name, promoteId: w.id })}
                          className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
                        >
                          {blockers.length > 1 ? 'Batalkan penghalang…' : 'Batalkan penghalang'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setModal({ booking: w, roomName: room_name })}
                        className="h-8 px-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length > VISIBLE && (
            <div className="border-t border-gray-100 px-5 py-3">
              <button type="button" onClick={() => setShowAll((s) => !s)} className="text-sm font-medium text-gray-900 hover:underline">
                {showAll ? 'Tampilkan lebih sedikit' : `Lihat semua ${entries.length}`}
              </button>
            </div>
          )}
        </div>
      )}

      <BookingActionsModal
        booking={modal?.booking ?? null}
        roomName={modal?.roomName ?? ''}
        preselectPromoteId={modal?.promoteId}
        rooms={rooms}
        onClose={() => setModal(null)}
      />
    </section>
  )
}
