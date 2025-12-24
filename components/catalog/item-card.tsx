import Link from 'next/link'
import type { Item } from '@/lib/actions/item-actions'
import { Badge } from '@/components/ui/badge'

interface ItemCardProps {
  item: Item
  showBorrowButton?: boolean
}

export function ItemCard({ item, showBorrowButton = true }: ItemCardProps) {
  const isAvailable = item.stock_available > 0
  const sensitiveLabel = item.is_sensitive ? 'Sensitif' : ''

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Item Image */}
      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl">{item.category?.icon || '📦'}</span>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="p-5">
        {/* Category and Status Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {item.category && (
            <Badge variant="default" className="flex items-center gap-1">
              {/* <span>{item.category.icon}</span> */}
              {item.category.name}
            </Badge>
          )}
          {item.is_sensitive && (
            <Badge variant="secondary">
              {sensitiveLabel}
            </Badge>
          )}
          <Badge variant={isAvailable ? 'success' : 'destructive'}>
            {isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
          </Badge>
        </div>

        {/* Item Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Stock Info */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-600">
            Stok: <strong className="text-gray-900">{item.stock_available}</strong> / {item.stock_total}
          </span>
          {item.location && (
            <span className="text-gray-500 text-xs">📍 {item.location}</span>
          )}
        </div>

        {/* Action Button */}
        {showBorrowButton && (
          isAvailable ? (
            <Link href={`/catalog/${item.id}`}>
              <button className="w-full py-2.5 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors">
                Pinjam Barang
              </button>
            </Link>
          ) : (
            <button 
              disabled 
              className="w-full py-2.5 bg-gray-300 text-gray-500 rounded-md font-medium cursor-not-allowed"
            >
              Stok Habis
            </button>
          )
        )}
      </div>
    </div>
  )
}
