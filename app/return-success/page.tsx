import Link from 'next/link'
import { CheckCircle, ClipboardCheck } from 'lucide-react'
import Image from 'next/image'

export default async function ReturnSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ already?: string }>
}) {
  const params = await searchParams
  const alreadyReturned = params.already === 'true'

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
            <p className="text-gray-600 mb-6 text-sm">
              Terima kasih telah mengkonfirmasi pengembalian barang. Konfirmasi Anda sudah tercatat
              di sistem.
            </p>

            <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Langkah selanjutnya:</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
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
          className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-95 text-center"
        >
          Kembali ke Katalog
        </Link>
      </div>
    </div>
  )
}

