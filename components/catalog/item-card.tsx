'use client'

import { useState } from 'react'
import type { Item } from '@/lib/actions/item-actions'
import { Badge } from '@/components/ui/badge'
import { BorrowModal } from '@/components/borrow/borrow-modal'
import { useItemDetail } from './item-detail-context'
import { ImageCarousel } from './image-carousel'
import { useCart } from '@/components/cart/cart-context'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Package2, MapPin } from 'lucide-react'

interface ItemCardProps {
  item: Item
  showBorrowButton?: boolean
}

export function ItemCard({ item, showBorrowButton = true }: ItemCardProps) {
  const isAvailable = item.stock_available > 0
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const { openItem } = useItemDetail()
  const { addItem, isInCart } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      id: item.id,
      name: item.name,
      quantity: 1,
      stock_available: item.stock_available,
      category: item.category ? {
        id: item.category.id,
        name: item.category.name,
        icon: item.category.icon ?? ''
      } : undefined,
      images: item.images || [],
      availableUnits: item.units?.filter((u: any) => u.is_available) || [],
      selectedUnits: [],
      is_borrowable: item.is_borrowable ?? true,
    })
  }

  return (
    <>
      <div
        className="h-full flex flex-col rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
        onClick={() => openItem(item)}
      >
        {/* Item Image */}
        <div className="relative flex-shrink-0">
          <ImageCarousel
            images={item.images || []}
            imageClassName="h-32 sm:h-48"
          />
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white px-4 py-2 rounded-lg font-semibold leading-none">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        {/* Item Info */}
        <div className="flex-1 flex flex-col p-3 sm:p-4">
          {/* Badges */}
          <div className="flex items-center gap-1 sm:gap-2 mb-1.5 flex-wrap flex-shrink-0">
            {item.category && (
              <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0 sm:py-0.5">
                {item.category.name}
              </Badge>
            )}
            <Badge variant={isAvailable ? 'success' : 'destructive'} className="text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0 sm:py-0.5">
              {isAvailable ? 'Tersedia' : 'Habis'}
            </Badge>
          </div>

          {/* Item Name */}
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 leading-tight mb-2">
            {item.name}
          </h3>

          {/* Stock & Location — always in one row, items aligned */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 whitespace-nowrap">
              <Package2 className="h-3 w-3 flex-shrink-0" />
              {item.is_borrowable ? (
                <><strong className="text-gray-900">{item.stock_available}</strong>/{item.stock_total}</>
              ) : (
                <>Stok: <strong className="text-gray-900 ml-0.5">{item.stock_available}</strong></>
              )}
            </div>
            {item.location && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 min-w-0">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{item.location}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showBorrowButton && (
            <div className="mt-auto pt-1">
              {isAvailable ? (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowBorrowModal(true) }}
                    className="flex-1 py-1 sm:py-1.5 bg-primary-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    {item.is_borrowable ? 'Pinjam' : 'Ambil'}
                  </button>
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    size="sm"
                    className="px-2.5"
                    title={isInCart(item.id) ? 'Sudah di keranjang' : 'Tambah ke keranjang'}
                  >
                    <ShoppingCart className={`h-4 w-4 ${isInCart(item.id) ? 'fill-primary-600 text-primary-600' : ''}`} />
                  </Button>
                </div>
              ) : (
                <button
                  disabled
                  onClick={(e) => e.stopPropagation()}
                  className="w-full py-1.5 bg-gray-100 text-gray-400 rounded text-xs sm:text-sm font-medium cursor-not-allowed border border-gray-200"
                >
                  Stok Habis
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Borrow Modal */}
      {showBorrowModal && (
        <BorrowModal
          initialItems={[{
            id: item.id,
            name: item.name,
            stock_available: item.stock_available,
            is_borrowable: item.is_borrowable,
            units: item.units,
          }]}
          onClose={() => setShowBorrowModal(false)}
        />
      )}
    </>
  )
}
