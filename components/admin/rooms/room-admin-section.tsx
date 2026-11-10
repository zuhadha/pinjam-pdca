import Link from 'next/link'
import { getRoomAdminData } from '@/lib/actions/room-admin-actions'
import { getCalendarBookings } from '@/lib/actions/room-actions'
import { fetchRange, parseDate, parseView } from '@/lib/rooms/calendar'
import { WaitlistPanel } from './waitlist-panel'
import { AdminSchedule } from './admin-schedule'

/** Kelola Booking Ruangan: waiting list first, then the schedule. */
export async function RoomBookingsSection(props: { cal?: string; date?: string; room?: string }) {
  const data = await getRoomAdminData()
  const view = parseView(props.cal)
  const date = parseDate(props.date, data.today)
  const roomId = Number(props.room) || null
  const { from, to } = fetchRange(view, date)
  const bookings = await getCalendarBookings({ from, to, roomId })

  const waiting = data.waitlist.length
  const ready = data.waitlist.filter((w) => w.blockers.length === 0).length

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Booking Ruangan</h1>
          <p className="mt-2 text-gray-600">
            {waiting === 0 ? (
              'Tidak ada booking di daftar tunggu.'
            ) : (
              <>
                <span className="font-semibold text-amber-800 tabular-nums">{waiting} booking</span> di daftar tunggu
                {ready > 0 && (
                  <>
                    , <span className="tabular-nums">{ready}</span> bisa langsung dikonfirmasi
                  </>
                )}
                .
              </>
            )}{' '}
            <span className="tabular-nums">{data.todayCount}</span> booking terkonfirmasi hari ini.
          </p>
        </div>
        <Link
          href="/rooms#booking"
          className="inline-flex h-10 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Booking baru
        </Link>
      </header>

      <WaitlistPanel entries={data.waitlist} rooms={data.rooms} />

      <section aria-labelledby="schedule-title" className="rounded-lg border border-gray-200 bg-white p-3 sm:p-5">
        <h2 id="schedule-title" className="pb-3 text-base font-semibold text-gray-900">
          Jadwal
        </h2>
        <AdminSchedule
          view={view}
          date={date}
          today={data.today}
          roomId={roomId}
          rooms={data.rooms}
          bookings={bookings}
        />
      </section>

    </div>
  )
}
