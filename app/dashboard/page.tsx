import { getCurrentUser } from '@/lib/auth/actions'
import { getUserBorrowRequests } from '@/lib/actions/borrow-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReturnButton } from '@/components/dashboard/return-button'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  // Redirect admin to admin dashboard
  if (user.role === 'admin') {
    redirect('/admin')
  }

  const borrowRequests = await getUserBorrowRequests(user.id)

  // Count stats
  const activeBorrows = borrowRequests.filter(r => r.status === 'approved' || r.status === 'borrowed').length
  const awaitingVerification = borrowRequests.filter(r => r.return_declared_at && !r.return_verified_at).length
  
  // Calculate overdue (borrowed items past end_datetime)
  const now = new Date()
  const overdueBorrows = borrowRequests.filter(r => {
    if (r.status !== 'borrowed' || r.is_permanent) return false
    if (!r.end_datetime) return false
    return new Date(r.end_datetime) < now
  }).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Selamat datang, {user.name}!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow text-center">
            <CardHeader>
              <CardTitle>
                Peminjaman Aktif
              </CardTitle>
              <CardDescription>
                Barang yang sedang Anda pinjam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary-600">{activeBorrows}</p>
                <p className="text-sm text-gray-600 mt-1">Peminjaman Aktif</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow text-center">
            <CardHeader>
              <CardTitle>
                Menunggu Verifikasi
              </CardTitle>
              <CardDescription>
                Pengembalian yang menunggu verifikasi admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-blue-600">{awaitingVerification}</p>
                <p className="text-sm text-gray-600 mt-1">Menunggu Verifikasi</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow text-center">
            <CardHeader>
              <CardTitle>
                Terlambat Dikembalikan
              </CardTitle>
              <CardDescription>
                Peminjaman yang melewati batas waktu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className={`text-4xl font-bold ${overdueBorrows === 0 ? 'text-green-600' : 'text-red-600'}`}>{overdueBorrows}</p>
                <p className="text-sm text-gray-600 mt-1">Item Terlambat</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Borrow Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Peminjaman</CardTitle>
            <CardDescription>
              Aktivitas peminjaman barang Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {borrowRequests.length > 0 ? (
              <div className="space-y-4">
                {borrowRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className='flex gap-2'>
                        <Badge variant={
                           request.return_declared_at ? 'blue' :
                           request.status === 'approved' || request.status === 'borrowed' ? (request.is_permanent ? 'default' : 'success') :
                           request.status === 'pending' ? 'warning' :
                           request.status === 'rejected' ? 'destructive' :
                           request.status === 'returned' ? 'gray' :
                           'gray'
                         }>
                           {request.return_declared_at ? 'Menunggu Verifikasi' :
                            request.status === 'approved' ? 'Disetujui' :
                            request.status === 'borrowed' ? (request.is_permanent ? 'Taken' : 'Sedang Dipinjam') :
                            request.status === 'pending' ? 'Menunggu Persetujuan' :
                            request.status === 'rejected' ? 'Ditolak' :
                            request.status === 'returned' ? 'Dikembalikan' :
                            request.status}
                         </Badge>
                         {request.is_permanent && (
                           <Badge variant="secondary">Permanent</Badge>
                         )}
                         {request.is_same_day && (
                           <Badge variant="outline">Sehari</Badge>
                         )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(request.created_at), 'dd MMM yyyy', { locale: idLocale })}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Barang:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.borrow_items?.map((bi: any) => (
                          <span key={bi.id} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded text-sm">
                            <span>{bi.item?.category?.icon || '📦'}</span>
                            <span>{bi.item?.name}</span>
                            <span className="text-gray-600">x{bi.quantity}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-600">Tanggal:</span>
                        <p className="font-medium text-gray-900">
                          {request.is_same_day ? (
                            // Same-day: show date with time range
                            `${format(new Date(request.start_datetime), 'dd MMM yyyy', { locale: idLocale })}, ${format(new Date(request.start_datetime), 'HH:mm')} - ${format(new Date(request.end_datetime), 'HH:mm')}`
                          ) : (
                            // Multi-day: show date range
                            `${format(new Date(request.start_datetime), 'dd MMM', { locale: idLocale })} - ${format(new Date(request.end_datetime), 'dd MMM yyyy', { locale: idLocale })}`
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Keperluan:</span>
                        <p className="font-medium text-gray-900">{request.purpose}</p>
                      </div>
                    </div>

                    {/* Usage Location */}
                    <div className="mb-3 text-sm">
                      <span className="text-gray-600">Lokasi Penggunaan:</span>
                      <p className="font-medium text-gray-900">{request.usage_location}</p>
                    </div>

                    {/* Actions - Hide for permanent requests */}
                    {!request.is_permanent && !request.return_declared_at && (request.status === 'approved' || request.status === 'borrowed') && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <ReturnButton requestId={request.id} />
                      </div>
                    )}

                    {request.return_declared_at && !request.return_verified_at && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
                          ℹ️ Pengembalian barang Anda sedang menunggu verifikasi admin.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 mb-4">Belum ada riwayat peminjaman</p>
                <Link href="/catalog">
                  <Button variant="outline">
                    Mulai Pinjam Barang
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <div className="mt-8 bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h3 className="font-semibold text-primary-900 mb-2">ℹ️ Informasi</h3>
          <ul className="text-sm text-primary-800 space-y-2">
            <li>• Pastikan mengembalikan barang sesuai tanggal yang telah ditentukan</li>
            <li>• Untuk barang sensitif, pengajuan memerlukan persetujuan admin</li>
            <li>• Laporkan segera jika ada kerusakan atau kehilangan barang</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
