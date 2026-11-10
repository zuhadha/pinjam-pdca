import { CalendarCheck, CalendarClock, CalendarDays, CalendarRange, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRoomDashboardData } from '@/lib/actions/room-dashboard-actions'
import { buildRoomDashboard, type DashboardFilter } from '@/lib/rooms/dashboard'
import { formatDateLong, formatMonth, formatRange, startOfWeek, addDays } from '@/lib/rooms/dates'
import { RoomDashboardCharts } from './room-dashboard-charts'

function StatCard({
  title,
  value,
  caption,
  icon,
}: {
  title: string
  value: number
  caption: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums text-gray-900">{value}</div>
        <p className="mt-1 text-xs text-gray-600">{caption}</p>
      </CardContent>
    </Card>
  )
}

/** Room booking dashboard; follows the period filter at the top of the admin dashboard. */
export async function RoomDashboard({ filter }: { filter: DashboardFilter }) {
  const data = await getRoomDashboardData(filter.year)
  if (!data) return <p className="text-sm text-red-700">Dashboard ruangan gagal dimuat.</p>

  const dash = buildRoomDashboard(data, filter)
  const weekFrom = startOfWeek(data.today)

  return (
    <section aria-labelledby="room-dashboard-title" className="space-y-6">
      <div>
        <h2 id="room-dashboard-title" className="text-2xl font-bold text-gray-900">
          Booking Ruangan
        </h2>
        <p className="mt-1 text-gray-600">Pemakaian ruangan pada periode yang dipilih di atas</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Booking"
          value={dash.totalBookings}
          caption={`Pengajuan · ${dash.periodLabel}`}
          icon={<CalendarCheck className="h-5 w-5 text-primary-600" />}
        />
        <StatCard
          title="Total Jadwal"
          value={dash.totalDates}
          caption={`Hari ruangan terpakai · ${dash.periodLabel}`}
          icon={<CalendarDays className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title="Hari Ini"
          value={data.todayCount}
          caption={formatDateLong(data.today)}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          title="Minggu Ini"
          value={data.weekCount}
          caption={formatRange(weekFrom, addDays(weekFrom, 6))}
          icon={<CalendarRange className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          title="Bulan Ini"
          value={data.monthCount}
          caption={formatMonth(data.today)}
          icon={<CalendarClock className="h-5 w-5 text-violet-600" />}
        />
      </div>

      <RoomDashboardCharts data={dash} />
    </section>
  )
}
