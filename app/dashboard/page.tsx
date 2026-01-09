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
import { BorrowHistoryTable } from '@/components/dashboard/borrow-history-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  const activeBorrows = borrowRequests.filter(r => r.status === 'borrowed' && !r.return_verified_at).length
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

        {/* History Tables with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Aktivitas</CardTitle>
            <CardDescription>
              Peminjaman dan permintaan barang Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="borrowing" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="borrowing">
                  Peminjaman
                </TabsTrigger>
                <TabsTrigger value="permanent">
                  Permintaan Barang
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="borrowing">
                <BorrowHistoryTable 
                  requests={borrowRequests.filter(r => !r.is_permanent)} 
                />
              </TabsContent>
              
              <TabsContent value="permanent">
                <BorrowHistoryTable 
                  requests={borrowRequests.filter(r => r.is_permanent)} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-primary-200 rounded-lg p-6">
          <h3 className="font-semibold text-primary-900 mb-2">ℹ️ Informasi</h3>
          <ul className="text-sm text-primary-800 space-y-2">
            <li>Pastikan mengembalikan barang sesuai tanggal yang telah ditentukan</li>
            <li>Laporkan segera jika ada kerusakan atau kehilangan barang</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
