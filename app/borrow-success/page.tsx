import Link from 'next/link'
import { CheckCircle, Mail, Package, ArrowLeft, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface BorrowSuccessPageProps {
  searchParams: Promise<{
    name?: string
    email?: string
    items?: string
    qty?: string
    type?: string
  }>
}

export default async function BorrowSuccessPage({ searchParams }: BorrowSuccessPageProps) {
  const params = await searchParams
  const borrowerName = params.name || 'Pengguna'
  const borrowerEmail = params.email || ''
  const itemCount = parseInt(params.items || '1', 10)
  // qty = total unit (selected units or quantity spinner)
  const qty = parseInt(params.qty || params.items || '1', 10)
  const isRequest = params.type === 'request'

  const title = isRequest ? 'Permintaan Berhasil!' : 'Peminjaman Berhasil!'
  const headerColor = isRequest ? 'bg-blue-600' : 'bg-green-600'
  const itemLabel = qty > 1 ? `${qty} unit` : '1 unit'
  const itemTypeLabel = itemCount > 1 ? `${itemCount} jenis barang` : '1 barang'

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

      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl z-10 overflow-hidden border border-white/20">
        <div className="max-h-[90vh] overflow-auto">
          {/* Header Banner */}
          <div className={`${headerColor} px-6 py-6 flex items-center gap-4`}>
            <div className="bg-white/20 rounded-full p-3 flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              <p className="text-white/80 text-sm mt-0.5">
                {isRequest
                  ? `${itemLabel} (${itemTypeLabel}) berhasil diajukan`
                  : `${itemLabel} (${itemTypeLabel}) telah dicatat dalam sistem`}
              </p>
            </div>
          </div>

          {/* Body — two-column on desktop */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              {/* Greeting */}
              <div>
                <p className="text-gray-700 text-sm">
                  Halo, <strong>{borrowerName}</strong>!{' '}
                  {isRequest
                    ? 'Permintaan barang Anda telah diterima oleh sistem.'
                    : 'Peminjaman barang Anda telah berhasil dicatat.'}
                </p>
              </div>

              {/* Email info */}
              <div className={`rounded-xl p-4 border ${isRequest ? 'bg-blue-50/80 border-blue-100' : 'bg-green-50/80 border-green-100'}`}>
                <div className="flex items-start gap-3">
                  <Mail className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isRequest ? 'text-blue-600' : 'text-green-700'}`} />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${isRequest ? 'text-blue-900' : 'text-green-900'}`}>
                      Email Konfirmasi Terkirim
                    </p>
                    <p className={`text-xs leading-relaxed ${isRequest ? 'text-blue-700' : 'text-green-800'}`}>
                      {borrowerEmail
                        ? <span>Dikirim ke <strong>{borrowerEmail}</strong></span>
                        : 'Dikirim ke email Anda'}
                      {isRequest
                        ? '. Silakan simpan sebagai bukti permintaan.'
                        : '. Simpan email ini — link untuk mengembalikan barang ada di dalamnya.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next steps */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Langkah Selanjutnya
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary-100 text-primary-700 rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">1</div>
                    <p className="text-xs text-gray-600">
                      <strong>Ambil barang</strong> — hubungi PIC departemen terkait dan tunjukkan email konfirmasi sebagai bukti.
                    </p>
                  </div>

                  {isRequest ? (
                    <div className="flex items-start gap-3">
                      <div className="bg-primary-100 text-primary-700 rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">2</div>
                      <p className="text-xs text-gray-600">
                        <strong>Gunakan barang</strong> sesuai kebutuhan Anda. Untuk barang permintaan tidak perlu dikembalikan.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary-100 text-primary-700 rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">2</div>
                        <p className="text-xs text-gray-600">
                          <strong>Gunakan barang</strong> sesuai jadwal dan kembalikan tepat waktu.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary-100 text-primary-700 rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">3</div>
                        <p className="text-xs text-gray-600">
                          <strong>Konfirmasi pengembalian</strong> — klik tombol di email yang sudah dikirim.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4 flex flex-col">
              {/* Summary card */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Ringkasan {isRequest ? 'Permintaan' : 'Peminjaman'}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Peminjam</span>
                    <span className="font-medium text-gray-900">{borrowerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Jenis Barang</span>
                    <span className="font-medium text-gray-900">{itemTypeLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Unit</span>
                    <span className="font-medium text-gray-900">{itemLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipe</span>
                    <span className={`font-medium text-sm px-2 py-0.5 rounded ${isRequest ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {isRequest ? 'Permintaan' : 'Peminjaman'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reminder note */}
              {!isRequest && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Pengingat Otomatis:</strong> Sistem akan mengirim email pengingat jika barang belum dikonfirmasi setelah waktu peminjaman habis.
                    </p>
                  </div>
                </div>
              )}

              {/* CTA */}
              <Link href="/catalog">
                <Button variant="outline" className="w-full gap-2 rounded-xl" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Katalog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

