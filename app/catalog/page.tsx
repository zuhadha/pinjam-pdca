import { getItems, getCategories } from '@/lib/actions/item-actions'
import { ItemCard } from '@/components/catalog/item-card'
import { SearchFilters } from '@/components/catalog/search-filters'

interface CatalogPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    available?: string
    type?: string
  }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams
  const categories = await getCategories()
  const items = await getItems({
    search: params.search,
    categoryId: params.category,
    availableOnly: params.available === 'true',
    isBorrowable: params.type === 'pinjam' ? true : params.type === 'minta' ? false : undefined,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 mt-14 lg:mt-0">
        {/* Header (Desktop only) */}
        <div className="mb-8 hidden lg:block">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Katalog Barang</h1>
          <p className="text-lg text-gray-600">
            Lihat dan pinjam barang yang tersedia untuk keperluan kantor
          </p>
        </div>

        {/* Search and Filters */}
        <SearchFilters categories={categories} />

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {params.search && (
              <> untuk pencarian <strong className="text-primary-600">"{params.search}"</strong></>
            )}
          </p>
        </div>

        {/* Items Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tidak ada barang ditemukan
            </h3>
            <p className="text-gray-600 mb-6">
              Coba ubah filter atau kata kunci pencarian Anda
            </p>
            <a href="/catalog">
              <button className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                Reset & Lihat Semua Barang
              </button>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
