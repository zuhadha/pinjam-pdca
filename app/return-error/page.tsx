import Link from 'next/link'
import { XCircle } from 'lucide-react'

const errorMessages: Record<string, { title: string; message: string }> = {
  missing_token: {
    title: 'Link Tidak Valid',
    message: 'Link yang Anda klik tidak memiliki token yang valid. Silakan gunakan link dari email terbaru.',
  },
  invalid_token: {
    title: 'Token Tidak Valid',
    message: 'Token yang Anda gunakan tidak ditemukan di sistem. Pastikan Anda menggunakan link dari email yang benar.',
  },
  token_used: {
    title: 'Token Sudah Digunakan',
    message: 'Link ini sudah pernah digunakan sebelumnya. Setiap link hanya dapat digunakan satu kali.',
  },
  token_expired: {
    title: 'Token Kedaluwarsa',
    message: 'Link ini sudah kedaluwarsa (lebih dari 7 hari). Silakan tunggu email reminder berikutnya atau hubungi admin.',
  },
  request_not_found: {
    title: 'Peminjaman Tidak Ditemukan',
    message: 'Data peminjaman tidak ditemukan di sistem. Kemungkinan sudah dihapus atau diubah.',
  },
  update_failed: {
    title: 'Gagal Memperbarui',
    message: 'Terjadi kesalahan saat memperbarui status peminjaman. Silakan coba lagi atau hubungi admin.',
  },
  unexpected_error: {
    title: 'Terjadi Kesalahan',
    message: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi nanti atau hubungi admin.',
  },
}

export default function ReturnErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string }
}) {
  const reason = searchParams.reason || 'unexpected_error'
  const errorInfo = errorMessages[reason] || errorMessages.unexpected_error

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="w-20 h-20 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{errorInfo.title}</h1>

        <p className="text-gray-600 mb-6">{errorInfo.message}</p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Butuh Bantuan?</strong>
            <br />
            Hubungi admin untuk mendapatkan bantuan terkait konfirmasi pengembalian barang Anda.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Lihat Dashboard
          </Link>

          <Link
            href="/catalog"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    </div>
  )
}
