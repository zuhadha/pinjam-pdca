import Link from 'next/link'
import { XCircle, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

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

export default async function ReturnErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const params = await searchParams
  const reason = params.reason || 'unexpected_error'
  const errorInfo = errorMessages[reason] || errorMessages.unexpected_error

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 overflow-hidden px-4">
      {/* Background Image with Blur */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/bg-login.webp"
          alt="Background"
          fill
          className="object-cover blur-[8px] scale-105 opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-black/20" /> {/* subtle overlay */}
      </div>

      <div className="w-full max-w-md px-8 py-10 rounded-3xl bg-white backdrop-blur-xl shadow-2xl z-10 mx-4 border border-white/20 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 rounded-full p-4">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">{errorInfo.title}</h1>

        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{errorInfo.message}</p>

        <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">Butuh Bantuan?</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Hubungi admin untuk mendapatkan bantuan terkait konfirmasi pengembalian barang Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/catalog"
            className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Kembali ke Katalog
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
          >
            Halaman Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}

