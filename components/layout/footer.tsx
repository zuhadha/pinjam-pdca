interface FooterProps {
  /** Show the small "Admin Login" link (for visitors who aren't logged in). */
  showAdminLogin?: boolean
}

export function Footer({ showAdminLogin = false }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            © 2025 <strong>INVENSA</strong>. Dibuat dengan ❤️ oleh Tim PDCA BUE.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Kelola peminjaman barang kantor dengan mudah dan terorganisir
          </p>
          {showAdminLogin && (
            <a href="/login" className="inline-block text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Admin Login
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
