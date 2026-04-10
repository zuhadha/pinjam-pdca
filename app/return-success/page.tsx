import Link from 'next/link'
import { CheckCircle, ClipboardCheck } from 'lucide-react'

export default async function ReturnSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ already?: string }>
}) {
  const params = await searchParams
  const alreadyReturned = params.already === 'true'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {alreadyReturned ? 'Sudah Dikonfirmasi' : 'Pengembalian Dikonfirmasi!'}
        </h1>

        {alreadyReturned ? (
          <p className="text-gray-600 mb-6">
            Pengembalian barang ini sudah dikonfirmasi sebelumnya. Terima kasih!
          </p>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Terima kasih telah mengkonfirmasi pengembalian barang. Konfirmasi Anda sudah tercatat
              di sistem.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Langkah selanjutnya:</p>
                  <p className="text-sm text-blue-800">
                    Silakan kembalikan barang kepada PIC departemen terkait. Admin akan melakukan
                    verifikasi fisik untuk menyelesaikan proses pengembalian.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <Link
          href="/catalog"
          className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Kembali ke Katalog
        </Link>
      </div>
    </div>
  )
}
