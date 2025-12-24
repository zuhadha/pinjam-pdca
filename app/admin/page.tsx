import { getAdminStats, getAllBorrowRequests } from '@/lib/actions/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, FileText, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()
  const recentRequests = await getAllBorrowRequests({})

  if (!stats) {
    return <div>Error loading dashboard</div>
  }

  const recentRequestsLimited = recentRequests.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-2">Selamat datang di panel administrasi sistem peminjaman barang</p>
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
            <CardTitle className="text-sm font-medium text-gray-600">Menunggu Persetujuan</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.pendingCount}</div>
            <p className="text-xs text-gray-600 mt-1">Perlu review</p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stok Menipis</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.lowStockCount}</div>
            <p className="text-xs text-gray-600 mt-1">Perlu restock</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
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
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Peminjaman Terbaru</CardTitle>
              <CardDescription>5 permintaan peminjaman terakhir</CardDescription>
            </div>
            <Link href="/admin/requests">
              <Button variant="outline" size="sm">
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
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        request.status === 'approved' || request.status === 'borrowed' ? 'bg-green-100 text-green-700' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {request.status === 'pending' ? 'Pending' :
                         request.status === 'approved' ? 'Approved' :
                         request.status === 'borrowed' ? 'Borrowed' :
                         request.status === 'rejected' ? 'Rejected' :
                         request.status}
                      </span>
                      {request.return_declared_at && !request.return_verified_at && (
                        <span className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Perlu Verifikasi
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{request.user?.name}</p>
                    <p className="text-sm text-gray-600">{request.purpose}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(request.start_date), 'dd MMM yyyy')} - {format(new Date(request.end_date), 'dd MMM yyyy')}
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
      </Card>
    </div>
  )
}
