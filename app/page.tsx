import { FeaturedItems } from '@/components/landing/featured-items'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Sistem Peminjaman Barang
            </h1>
            <p className="text-xl sm:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Kelola peminjaman barang kantor dengan mudah, cepat, dan terorganisir
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/catalog">
                <button className="px-8 py-4 bg-white text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg">
                  Lihat Barang Tersedia
                </button>
              </a>
              <a href="/login">
                <button className="px-8 py-4 bg-primary-800 text-white rounded-lg font-semibold hover:bg-primary-900 transition-colors border-2 border-white/20">
                  Login Sekarang
                </button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Aturan Peminjaman
            </h2>
            <p className="text-lg text-gray-600">
              Pastikan mengikuti aturan berikut untuk kelancaran peminjaman
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Login Diperlukan</h3>
                <p className="text-gray-600">Anda harus login terlebih dahulu untuk melakukan peminjaman barang.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tentukan Durasi</h3>
                <p className="text-gray-600">Tentukan tanggal mulai dan tanggal pengembalian saat mengajukan peminjaman.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Persetujuan Admin</h3>
                <p className="text-gray-600">Barang sensitif memerlukan persetujuan admin sebelum dapat dipinjam.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">4</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Kembalikan Tepat Waktu</h3>
                <p className="text-gray-600">Kembalikan barang sesuai dengan tanggal yang telah ditentukan.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">5</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Jaga Kondisi Barang</h3>
                <p className="text-gray-600">Pastikan barang dalam kondisi baik saat dipinjam dan dikembalikan.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">6</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Laporkan Kerusakan</h3>
                <p className="text-gray-600">Segera laporkan kepada admin jika terjadi kerusakan atau kehilangan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Barang Populer
            </h2>
            <p className="text-lg text-gray-600">
              Barang yang sering dipinjam oleh karyawan
            </p>
          </div>

          <FeaturedItems />

          <div className="text-center mt-8">
            <a href="/catalog">
              <button className="px-6 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                Lihat Semua Barang →
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* QnA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pertanyaan Umum
            </h2>
            <p className="text-lg text-gray-600">
              Jawaban untuk pertanyaan yang sering diajukan
            </p>
          </div>

          <div className="space-y-4">
            <details className="group bg-gray-50 rounded-lg border border-gray-200 p-6">
              <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-gray-900">
                <span>Bagaimana cara meminjam barang?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                Login terlebih dahulu, kemudian buka halaman Katalog, pilih barang yang ingin dipinjam, klik tombol "Pinjam", isi form peminjaman dengan tanggal mulai, tanggal kembali, dan keperluan, lalu submit.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-lg border border-gray-200 p-6">
              <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-gray-900">
                <span>Apakah semua barang bisa langsung dipinjam?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                Tidak. Barang regular dapat langsung dipinjam (auto-approve), sedangkan barang sensitif seperti laptop, kamera, dan proyektor memerlukan persetujuan admin terlebih dahulu.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-lg border border-gray-200 p-6">
              <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-gray-900">
                <span>Berapa lama barang bisa dipinjam?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                Durasi peminjaman dapat disesuaikan dengan kebutuhan Anda. Namun pastikan untuk mengembalikan barang tepat waktu sesuai tanggal yang telah ditentukan saat pengajuan.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-lg border border-gray-200 p-6">
              <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-gray-900">
                <span>Bagaimana cara mengembalikan barang?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                Kembalikan barang secara fisik ke lokasi penyimpanan, kemudian klik tombol "Declare Return" di dashboard Anda. Admin akan memverifikasi pengembalian dan mengupdate status peminjaman.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-lg border border-gray-200 p-6">
              <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-gray-900">
                <span>Apa yang harus dilakukan jika barang rusak?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                Segera hubungi admin dan laporkan kerusakan yang terjadi. Jangan mencoba memperbaiki sendiri. Admin akan memberikan instruksi lebih lanjut terkait prosedur penanganan barang rusak.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-lg border border-gray-200 p-6">
              <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-gray-900">
                <span>Bisakah meminjam lebih dari satu barang sekaligus?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                Ya, Anda dapat meminjam beberapa barang sekaligus dalam satu pengajuan. Cukup pilih barang yang diinginkan dan tentukan quantity untuk masing-masing barang.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              © 2025 Garuda Food. Sistem Peminjaman Barang Internal.
            </p>
            <p className="text-sm text-gray-500">
              Kelola peminjaman barang kantor dengan mudah dan terorganisir
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
