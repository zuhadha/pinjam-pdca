import { getAdminStats, getAllBorrowRequests } from '@/lib/actions/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, FileText, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { DashboardCharts } from '@/components/admin/dashboard-charts'
import { MonthFilter } from '@/components/admin/month-filter'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const selectedMonth = params.month ? parseInt(params.month) : null
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear()

  const monthLabels = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const periodLabel = selectedMonth
    ? `${monthLabels[selectedMonth - 1]} ${selectedYear}`
    : `Tahun ${selectedYear}`

  const stats = await getAdminStats()
  const recentRequests = await getAllBorrowRequests({})

  if (!stats) {
    return <div>Error loading dashboard</div>
  }

  // Filter requests by selected month/year
  const filteredRequests = selectedMonth
    ? recentRequests.filter((r: any) => {
        const d = new Date(r.created_at)
        return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
      })
    : recentRequests.filter((r: any) => new Date(r.created_at).getFullYear() === selectedYear)

  const recentRequestsLimited = recentRequests.slice(0, 5)

  // -- Data Aggregation for Charts --
  const chartData = filteredRequests

  // 1. Tren Peminjaman — mengikuti filter bulan/tahun
  // Jika semua bulan dipilih: tampilkan per bulan (Jan–Des). Jika bulan spesifik dipilih: tampilkan per tanggal.
  const trendData = selectedMonth
    ? Array.from({ length: 31 }, (_, i) => {
        const day = i + 1
        const dateStr = String(day).padStart(2, '0')
        return {
          date: dateStr,
          total: chartData.filter((r: any) => {
            const d = new Date(r.created_at)
            return d.getDate() === day
          }).length
        }
      })
    : Array.from({ length: 12 }, (_, i) => {
        const monthLabel = monthLabels[i].slice(0, 3)
        return {
          date: monthLabel,
          total: chartData.filter((r: any) => {
            const d = new Date(r.created_at)
            return d.getMonth() === i
          }).length
        }
      })

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-2">Selamat datang di panel administrasi sistem peminjaman barang</p>
        </div>
        <MonthFilter />
      </div>

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
        categoryData={categoryData}
        topItemsData={topItemsData}
        deptData={deptData}
        punctualityData={punctualityData}
      />

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
