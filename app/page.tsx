import { FeaturedItems } from '@/components/landing/featured-items'
import { getCurrentUser } from '@/lib/auth/actions'

export default async function HomePage() {
  const user = await getCurrentUser()
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white min-h-[600px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 -z-20">
          <img 
            src="/hero-img.webp" 
            alt="Hero background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 -z-10 bg-black/50"></div>
        
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              INVENSA
            </h1>
            <p className="text-base sm:text-lg text-primary-100 mb-2 font-medium tracking-widest uppercase">
              Sistem Inventaris & Peminjaman Barang
            </p>
            <p className="text-xl sm:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Kelola peminjaman barang kantor dengan mudah, cepat, dan terorganisir
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/catalog">
                <button className="px-8 py-4 bg-white text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg">
                  Lihat Barang Tersedia
                </button>
              </a>
              {/* {!user && (
                <a href="/login">
                  <button className="px-8 py-4 bg-primary-800 text-white rounded-lg font-semibold hover:bg-primary-900 transition-colors border-2 border-white/20">
                    Login Sekarang
                  </button>
                </a>
              )} */}
            </div>
          </div>
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
                <h3 className="font-semibold text-gray-900 mb-2">Isi Form Peminjaman</h3>
                <p className="text-gray-600">Pilih barang dari katalog, klik "Pinjam", lalu isi nama, email, divisi, dan keperluan Anda.</p>
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
                <p className="text-gray-600">Tentukan tanggal mulai dan tanggal pengembalian saat mengajukan peminjaman barang.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ambil Barang</h3>
                <p className="text-gray-600">Hubungi PIC departemen terkait dan tunjukkan email konfirmasi sebagai bukti pengajuan.</p>
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
                <p className="text-gray-600">Kembalikan barang sesuai tanggal yang ditentukan dan konfirmasi via link di email.</p>
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
                <p className="text-gray-600">Pastikan barang dalam kondisi baik saat dipinjam dan dikembalikan kepada PIC.</p>
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
                <p className="text-gray-600">Segera laporkan kepada admin jika terjadi kerusakan atau kehilangan barang yang dipinjam.</p>
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
                Buka Invensa melalui BU E potal, pastikan menggunakan wifi One Garudafood. Kemudian buka halaman katalog, 
                pilih barang yang ingin dipinjam, klik tombol "pinjam". Isi form peminjaman dengan nama peminjam, 
                alamat email peminjam, tanggal peminjaman, tanggal pengembalian, lokasi peminjaman.
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
                Durasi peminjaman dapat disesuaikan dengan kebutuhan anda, namun pastikan
                 untuk mengembalikan barang tepat waktu sesuai tanggal yang telah ditentukan saat pengajuan. 
                Apabila dikembalikannya tidak tepat waktu, akan ada reminder via email
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
                Kembalikan barang secara fisik ke lokasi penyimpanan, kemudian klik tombol 
                "Konfirmasi Pengembalian Barang" pada email. Admin akan memverifikasi 
                pengembalian dan mengupdate status peminjaman.
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
                Segera hubungi admin dan laporkan kerusakan yang terjadi. Jangan mencoba 
                memperbaiki sendiri. Admin akan memberikan instruksi lebih lanjut terkait 
                prosedur penanganan barang rusak.
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
                Ya, Anda dapat meminjam beberapa barang sekaligus dalam satu pengajuan. 
                Cukup pilih barang yang diinginkan dan tentukan quantity untuk masing-masing barang.
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
              © 2025 <strong>INVENSA</strong>. Dibuat dengan ❤️ oleh Tim PDCA BUE.
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
