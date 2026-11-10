import type { Metadata } from 'next'
import { getCalendarBookings, getPublicRooms, getRebookDetails } from '@/lib/actions/room-actions'
import { getCurrentUser } from '@/lib/auth/actions'
import { RoomsPlanner } from '@/components/rooms/rooms-planner'
import { RoomList } from '@/components/rooms/room-list'
import { fetchRange, parseDate, parseView } from '@/lib/rooms/calendar'
import { isDateString, isTimeString, todayJakarta } from '@/lib/rooms/dates'

export const metadata: Metadata = {
  title: 'Ruangan · INVENSA',
  description: 'Booking ruang meeting tanpa menunggu persetujuan dan lihat jadwalnya.',
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{
    cal?: string
    date?: string
    room?: string
    // booking form prefill
    book_room?: string
    book_date?: string
    start?: string
    // fill everything except the date from this booking
    rebook?: string
  }>
}) {
  const params = await searchParams
  const today = todayJakarta()
  const view = parseView(params.cal)
  const date = parseDate(params.date, today)
  const roomId = Number(params.room) || null
  const { from, to } = fetchRange(view, date)

  const rebookId = Number(params.rebook) || null
  const [rooms, bookings, user, rebookDetails] = await Promise.all([
    getPublicRooms({ includeMaintenance: true }),
    getCalendarBookings({ from, to, roomId }),
    getCurrentUser(),
    rebookId ? getRebookDetails(rebookId) : Promise.resolve(null),
  ])
  const isAdmin = user?.role === 'admin'
  const bookableRooms = rooms.filter((r) => r.status === 'available')

  const hasPrefill = params.book_room || params.book_date || params.start || rebookDetails
  const prefillDate = isDateString(params.book_date) && (isAdmin || params.book_date >= today) ? params.book_date : today
  const prefill = hasPrefill
    ? {
        roomId: bookableRooms.find((r) => r.id === Number(params.book_room))?.id ?? null,
        date: prefillDate,
        start: isTimeString(params.start) ? params.start : null,
        rebook: rebookDetails && rebookId ? { ...rebookDetails, bookingId: rebookId } : undefined,
      }
    : null

  return (
    <main className="min-h-screen bg-[#f2f4f7]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Ruangan</h1>

        <RoomsPlanner
          bookableRooms={bookableRooms}
          isAdmin={isAdmin}
          prefill={prefill}
          calendar={{ view, date, today, roomId, rooms, bookings, basePath: '/rooms' }}
        />

        <section aria-labelledby="rooms-title" className="mt-12">
          <h2 id="rooms-title" className="text-xl font-semibold text-gray-900">
            Daftar ruangan
          </h2>
          <p className="mt-1 text-sm text-gray-600">{rooms.length} ruangan · jam booking 08:00–17:00</p>
          <RoomList rooms={rooms} today={today} />
        </section>
      </div>
    </main>
  )
}
