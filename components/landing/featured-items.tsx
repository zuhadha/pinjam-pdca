import { getFeaturedItems } from '@/lib/actions/item-actions'
import { ItemCard } from '@/components/catalog/item-card'

export async function FeaturedItems() {
  const items = await getFeaturedItems(6)

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-600">Belum ada barang tersedia</p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
