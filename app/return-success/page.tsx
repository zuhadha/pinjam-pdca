import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function ReturnSuccessPage({
  searchParams,
}: {
  searchParams: { already?: string }
}) {
  const alreadyReturned = searchParams.already === 'true'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {alreadyReturned ? 'Sudah Dikonfirmasi' : 'Pengembalian Dikonfirmasi!'}
        </h1>

        {alreadyReturned ? (
          <p className="text-gray-600 mb-6">
            Pengembalian barang ini sudah dikonfirmasi sebelumnya. Terima kasih!
          </p>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Terima kasih telah mengkonfirmasi pengembalian barang. Admin akan segera melakukan
              verifikasi fisik barang.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Langkah selanjutnya:</strong>
                <br />
                Silakan kembalikan barang ke admin untuk proses verifikasi dan penyelesaian
                peminjaman.
              </p>
            </div>
          </>
        )}

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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
