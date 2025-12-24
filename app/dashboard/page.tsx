import { getCurrentUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  // Redirect admin to admin dashboard
  if (user.role === 'admin') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Selamat datang, {user.name}!</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                Pinjam Barang
              </CardTitle>
              <CardDescription>
                Lihat katalog dan ajukan peminjaman barang
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/catalog">
                <Button variant="primary" className="w-full">
                  Lihat Katalog
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Peminjaman Aktif
              </CardTitle>
              <CardDescription>
                Barang yang sedang Anda pinjam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary-600">0</p>
                <p className="text-sm text-gray-600 mt-1">Peminjaman Aktif</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                Menunggu Persetujuan
              </CardTitle>
              <CardDescription>
                Pengajuan yang menunggu persetujuan admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-secondary-600">0</p>
                <p className="text-sm text-gray-600 mt-1">Pengajuan Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Peminjaman</CardTitle>
            <CardDescription>
              Aktivitas peminjaman barang Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 mb-4">Belum ada riwayat peminjaman</p>
              <Link href="/catalog">
                <Button variant="outline">
                  Mulai Pinjam Barang
                </Button>
              </Link>
            </div>
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
