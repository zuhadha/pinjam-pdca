import { getAdminStats, getDashboardRequests } from '@/lib/actions/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, FileText, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { DashboardCharts } from '@/components/admin/dashboard-charts'
import { MonthFilter } from '@/components/admin/month-filter'
import { RoomDashboard } from '@/components/admin/rooms/room-dashboard'
import {
  MONTH_LONG,
  formatWeekRange,
  parseNumberList,
  summarizeMonths,
  summarizeWeeks,
  weekOfYear,
  weeksForMonths,
  weeksInYear,
} from '@/lib/utils/week-utils'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string
    months?: string
    weeks?: string
    year?: string
    view?: string
    // room section
    section?: string
    cal?: string
    date?: string
    room?: string
  }>
}) {
  const params = await searchParams

  // Room management moved to its own pages; keep old links (and emails) working
  if (params.section === 'rooms') {
    const q = new URLSearchParams()
    if (params.cal) q.set('cal', params.cal)
    if (params.date) q.set('date', params.date)
    if (params.room) q.set('room', params.room)
    redirect(`/admin/room-bookings${q.size ? `?${q}` : ''}`)
  }

  const selectedYear = params.year ? parseInt(params.year) || new Date().getFullYear() : new Date().getFullYear()
  // `month` is the old single-month param, still accepted for saved links
  const selectedMonths = parseNumberList(params.months ?? params.month, 1, 12)
  const selectedWeeks = parseNumberList(params.weeks, 1, weeksInYear(selectedYear))
  const viewMode: 'month' | 'week' = params.view === 'week' ? 'week' : 'month'

  const periodLabel = [
    selectedMonths.length === 1
      ? `${MONTH_LONG[selectedMonths[0] - 1]} ${selectedYear}`
      : selectedMonths.length > 1
        ? `${summarizeMonths(selectedMonths)} ${selectedYear}`
        : `Tahun ${selectedYear}`,
    selectedWeeks.length ? summarizeWeeks(selectedWeeks) : null,
  ].filter(Boolean).join(' · ')

  const [stats, recentRequests] = await Promise.all([getAdminStats(), getDashboardRequests()])

  if (!stats) {
    return <div>Error loading dashboard</div>
  }

  // Filter requests by selected year, months and weeks
  const filteredRequests = recentRequests.filter((r: any) => {
    const d = new Date(r.created_at)
    if (d.getFullYear() !== selectedYear) return false
    if (selectedMonths.length && !selectedMonths.includes(d.getMonth() + 1)) return false
    if (selectedWeeks.length && !selectedWeeks.includes(weekOfYear(d))) return false
    return true
  })

  const recentRequestsLimited = recentRequests.slice(0, 5)

  // -- Data Aggregation for Charts --
  const chartData = filteredRequests

  // 1. Tren Peminjaman — mengikuti filter & mode tampilan
  // Mingguan: per nomor minggu. Bulanan: per tanggal jika 1 bulan dipilih, selain itu per bulan.
  let trendData: { date: string; total: number; range?: string }[]
  let trendDescription: string

  if (viewMode === 'week') {
    const weeks = selectedWeeks.length ? selectedWeeks : weeksForMonths(selectedYear, selectedMonths)
    const counts = new Map<number, number>()
    chartData.forEach((r: any) => {
      const w = weekOfYear(new Date(r.created_at))
      counts.set(w, (counts.get(w) || 0) + 1)
    })
    trendData = weeks.map((w) => ({
      date: `W${w}`,
      total: counts.get(w) || 0,
      range: formatWeekRange(selectedYear, w),
    }))
    trendDescription = 'Jumlah peminjaman per minggu'
  } else if (selectedMonths.length === 1) {
    const month = selectedMonths[0]
    const daysInMonth = new Date(selectedYear, month, 0).getDate()
    const counts = new Map<number, number>()
    chartData.forEach((r: any) => {
      const day = new Date(r.created_at).getDate()
      counts.set(day, (counts.get(day) || 0) + 1)
    })
    trendData = Array.from({ length: daysInMonth }, (_, i) => ({
      date: String(i + 1).padStart(2, '0'),
      total: counts.get(i + 1) || 0,
      range: `${i + 1} ${MONTH_LONG[month - 1]}`,
    }))
    trendDescription = `Jumlah peminjaman per hari · ${MONTH_LONG[month - 1]} ${selectedYear}`
  } else {
    const months = selectedMonths.length ? selectedMonths : Array.from({ length: 12 }, (_, i) => i + 1)
    const counts = new Map<number, number>()
    chartData.forEach((r: any) => {
      const m = new Date(r.created_at).getMonth() + 1
      counts.set(m, (counts.get(m) || 0) + 1)
    })
    trendData = months.map((m) => ({
      date: MONTH_LONG[m - 1].slice(0, 3),
      total: counts.get(m) || 0,
      range: `${MONTH_LONG[m - 1]} ${selectedYear}`,
    }))
    trendDescription = 'Jumlah peminjaman per bulan'
  }

  // 2. Kategori Terbanyak
  const categoryMap = new Map<string, number>()
  chartData.forEach((req: any) => {
    req.borrow_items?.forEach((bi: any) => {
      const catName = bi.item?.category?.name || 'Lainnya'
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + bi.quantity)
    })
  })
  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // 3. Top 3 Barang
  const itemMap = new Map<string, number>()
  chartData.forEach((req: any) => {
    req.borrow_items?.forEach((bi: any) => {
      const itemName = bi.item?.name || 'Barang Tidak Dikenal'
      itemMap.set(itemName, (itemMap.get(itemName) || 0) + bi.quantity)
    })
  })
  const topItemsData = Array.from(itemMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  // 4. Departemen Paling Aktif
  const deptMap = new Map<string, number>()
  chartData.forEach((req: any) => {
    const dept = req.borrower_division || 'Lainnya'
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
  })
  const deptData = Array.from(deptMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // 5. Ketepatan Waktu Pengembalian
  let onTime = 0
  let late = 0
  chartData.forEach((req: any) => {
    if (req.return_verified_at && req.end_datetime) {
      const returnDate = new Date(req.return_verified_at)
      const endDate = new Date(req.end_datetime)
      if (returnDate > endDate) {
        late++
      } else {
        onTime++
      }
    } else if (req.status === 'borrowed' && req.end_datetime) {
      // Jika masih dipinjam tapi sudah lewat deadline
      const today = new Date()
      const endDate = new Date(req.end_datetime)
      if (today > endDate) {
        late++
      }
    }
  })
  
  // Jika belum ada data sama sekali, berikan nilai default agar chart tetap render cantik
  if (onTime === 0 && late === 0) {
    onTime = 1; 
  }

  const punctualityData = [
    { name: 'Tepat Waktu', value: onTime },
    { name: 'Terlambat', value: late }
  ]

  // ---------------------------------

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-2">Ringkasan peminjaman barang dan booking ruangan</p>
        </div>
        {/* Period filter on its own row so every control has room */}
        <MonthFilter />
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Peminjaman Barang</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Barang</CardTitle>
            <Package className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalItems}</div>
            <p className="text-xs text-gray-600 mt-1">{stats.totalCategories} kategori</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sedang Dipinjam</CardTitle>
            <FileText className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.borrowedCount}</div>
            <p className="text-xs text-gray-600 mt-1">Peminjaman aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Verifikasi Pengembalian</CardTitle>
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.verificationCount}</div>
            <p className="text-xs text-gray-600 mt-1">Menunggu verifikasi</p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stok Menipis</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.lowStockCount}</div>
            <p className="text-xs text-gray-600 mt-1">Perlu restock</p>
          </CardContent>
        </Card> */}

        {/* <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-primary-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/items">
              <Button variant="outline" className="w-full justify-start" size="sm">
                📦 Kelola Barang
              </Button>
            </Link>
            <Link href="/admin/requests">
              <Button variant="outline" className="w-full justify-start" size="sm">
                📋 Kelola Peminjaman
              </Button>
            </Link>
          </CardContent>
        </Card> */}
      </div>

      {/* Dashboard Charts */}
      <DashboardCharts
        periodLabel={periodLabel}
        trendData={trendData}
        trendDescription={trendDescription}
        categoryData={categoryData}
        topItemsData={topItemsData}
        deptData={deptData}
        punctualityData={punctualityData}
      />

      {/* Room bookings, same period filter */}
      <div className="border-t border-gray-200 pt-8">
        <RoomDashboard filter={{ year: selectedYear, months: selectedMonths, weeks: selectedWeeks, view: viewMode }} />
      </div>

      {/* Recent Requests */}
      {/* <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Peminjaman Terbaru</CardTitle>
              <CardDescription>5 permintaan peminjaman terakhir</CardDescription>
            </div>
            <Link href="/admin/requests">
              <Button variant="ghost" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentRequestsLimited.length > 0 ? (
            <div className="space-y-4">
              {recentRequestsLimited.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={
                        request.status === 'pending' ? 'warning' :
                        request.status === 'approved' || request.status === 'borrowed' ? (request.is_permanent ? 'default' : 'success') :
                        request.status === 'rejected' ? 'destructive' :
                        'gray'
                      }>
                        {request.status === 'pending' ? 'Pending' :
                         request.status === 'approved' ? 'Approved' :
                         request.status === 'borrowed' ? (request.is_permanent ? 'Taken' : 'Borrowed') :
                         request.status === 'rejected' ? 'Rejected' :
                         request.status}
                      </Badge>
                      {request.is_permanent && (
                        <Badge variant="secondary">Permanent</Badge>
                      )}
                      {request.return_declared_at && !request.return_verified_at && (
                        <Badge variant="blue">
                          Perlu Verifikasi
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{request.user?.name}</p>
                    <p className="text-sm text-gray-600">{request.purpose}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {request.is_same_day ? (
                        // Same-day: show date with time range
                        `${format(new Date(request.start_datetime), 'dd MMM yyyy, HH:mm')} - ${format(new Date(request.end_datetime), 'HH:mm')}`
                      ) : (
                        // Multi-day: show date range
                        `${format(new Date(request.start_datetime), 'dd MMM yyyy')} - ${format(new Date(request.end_datetime), 'dd MMM yyyy')}`
                      )}
                    </p>
                  </div>
                  <Link href={`/admin/requests`}>
                    <Button variant="outline" size="sm">
                      Detail
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Belum ada permintaan peminjaman
            </div>
          )}
        </CardContent>
      </Card> */}
    </div>
  )
}
