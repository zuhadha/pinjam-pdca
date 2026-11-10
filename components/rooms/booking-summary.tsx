import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { ManagedReservation } from '@/lib/actions/room-actions'
import { ROOM_DAY_END, ROOM_DAY_START } from '@/lib/rooms/constants'
import { formatDateLong, formatDateShort } from '@/lib/rooms/dates'

/** One "Label: value" line, as in the old COE Rooms confirmation. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-sm leading-6 text-gray-900">
      <span className="font-semibold">{label}:</span> {children}
    </p>
  )
}

/** Booking summary in the layout of the old COE Rooms "Booking Berhasil!" confirmation. */
export function BookingSummary({ data, justBooked }: { data: ManagedReservation; justBooked: boolean }) {
  const baru = justBooked
  const { reservation: r, bookings } = data
  const active = bookings.filter((b) => b.status !== 'cancelled')
  const confirmed = active.filter((b) => b.status === 'confirmed')
  const waiting = active.filter((b) => b.status === 'waitlisted')
  const shown = active.length ? active : bookings
  const first = shown[0]
  const last = shown[shown.length - 1]
  const roomNames = Array.from(new Set(shown.map((b) => b.room_name))).join(', ')

  const fullDay = first && first.start_time === ROOM_DAY_START && first.end_time === ROOM_DAY_END
  const time = first ? (fullDay ? `Full Time (${ROOM_DAY_START}–${ROOM_DAY_END})` : `${first.start_time} – ${first.end_time}`) : '-'
  const dateText = !first
    ? '-'
    : first.booking_date === last.booking_date
      ? formatDateLong(first.booking_date)
      : `${formatDateShort(first.booking_date, true)} – ${formatDateShort(last.booking_date, true)}`

  const state = !active.length ? 'cancelled' : confirmed.length ? 'ok' : 'waiting'
  const heading = {
    ok: 'Booking Berhasil!',
    waiting: 'Booking Masuk Daftar Tunggu',
    cancelled: 'Booking Dibatalkan',
  }[state]
  const Icon = { ok: CheckCircle2, waiting: Clock, cancelled: XCircle }[state]
  const iconColor = { ok: 'text-green-600', waiting: 'text-amber-600', cancelled: 'text-gray-400' }[state]

  return (
  <section aria-labelledby="booking-heading" className="mt-4 rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
    <div className="flex items-center gap-3">
      <Icon className={`h-7 w-7 shrink-0 ${iconColor}`} aria-hidden />
      <h1 id="booking-heading" className="text-xl font-semibold text-gray-900">
        {heading}
      </h1>
    </div>

    <div className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2">
      <div>
        <Fact label="Nama">{r.borrower_name}</Fact>
        <Fact label="Ruangan">{roomNames}</Fact>
        {r.email && <Fact label="Email">{r.email}</Fact>}
        <Fact label="Departemen">{r.department}</Fact>
        {r.participants && <Fact label="Dept. Peserta">{r.participants}</Fact>}
      </div>
      <div>
        <Fact label="Tanggal">{dateText}</Fact>
        <Fact label="Waktu">
          <span className="tabular-nums">{time}</span>
        </Fact>
        {r.people_count && <Fact label="Jumlah Orang">{r.people_count} orang</Fact>}
        <Fact label="Nama Agenda">{r.agenda}</Fact>
        {r.is_recurring && (
          <>
            <Fact label="Jenis Booking">Berulang</Fact>
            <Fact label="Total Jadwal">
              <span className="tabular-nums">{active.length}</span> jadwal
            </Fact>
          </>
        )}
      </div>
    </div>

    {r.is_recurring && active.length > 0 && (
      <div className="mt-5 border-l-4 border-blue-600 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <p className="font-semibold">Informasi Booking Berulang</p>
        <p className="mt-1">Booking ini berulang: {r.recurrence_summary}.</p>
        <p>
          Total <span className="tabular-nums">{active.length}</span> jadwal dibuat
          {confirmed.length !== active.length && (
            <>
              , <span className="tabular-nums">{confirmed.length}</span> terkonfirmasi
            </>
          )}
          .
        </p>
      </div>
    )}

    {waiting.length > 0 && (
      <div className="mt-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">
          Daftar Tunggu ({waiting.length} tanggal)
        </p>
        <p className="mt-1">
          Ruangan sudah dibooking pada {waiting.length === 1 ? 'tanggal' : 'tanggal-tanggal'} ini:{' '}
          {waiting.map((b) => formatDateShort(b.booking_date, true)).join(', ')}.
        </p>
        <p>Admin akan menghubungi Anda lewat WhatsApp bila ruangan kosong.</p>
      </div>
    )}

    {r.notes && (
      <p className="mt-4 text-sm text-gray-900">
        <span className="font-semibold">Catatan:</span> <span className="whitespace-pre-line">{r.notes}</span>
      </p>
    )}

    <hr className="my-5 border-gray-200" />
    <p className="text-sm text-gray-600">
      {state === 'cancelled'
        ? 'Semua tanggal booking ini sudah dibatalkan.'
        : 'Booking tidak perlu persetujuan admin. Batalkan di bawah bila agenda tidak jadi, agar ruangan bisa dipakai peminjam lain.'}{' '}
      {baru && r.email && 'Link halaman ini juga dikirim ke email Anda. '}
      Lihat jadwal di{' '}
      <Link href="/rooms" className="font-medium text-gray-900 underline underline-offset-4">
        halaman ruangan
      </Link>
      .
    </p>
  </section>
  )
}
