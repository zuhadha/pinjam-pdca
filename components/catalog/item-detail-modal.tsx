'use client'

import { X, Package2, MapPin } from 'lucide-react'
import { ImageCarousel } from '@/components/catalog/image-carousel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BorrowModal } from '@/components/borrow/borrow-modal'
import { useCart } from '@/components/cart/cart-context'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import type { Item } from '@/lib/actions/item-actions'

interface ItemDetailModalProps {
  item: Item
  onClose: () => void
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const { addItem, isInCart, toggleUnit } = useCart()
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const isAvailable = item.stock_available > 0

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      stock_available: item.stock_available,
      is_borrowable: item.is_borrowable,
      availableUnits: (item as any).units?.filter((u: any) => u.is_available) || [],
      selectedUnits: [],
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              {item.category && (
                <Badge variant="default" className="text-xs">
                  {item.category.name}
                </Badge>
              )}
              <Badge variant={isAvailable ? 'success' : 'destructive'} className="text-xs">
                {isAvailable ? 'Tersedia' : 'Stok Habis'}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image */}
          <ImageCarousel images={item.images || []} imageClassName="h-56" useBlurBackground />

          {/* Content */}
          <div className="px-5 py-4 space-y-4">
            {/* Name */}
            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            )}

            {/* Stock & Location row */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 text-gray-600">
                <Package2 className="h-4 w-4 flex-shrink-0" />
                {item.is_borrowable ? (
                  <span><strong className="text-gray-900">{item.stock_available}</strong> / {item.stock_total} tersedia</span>
                ) : (
                  <span>Stok: <strong className="text-gray-900">{item.stock_available}</strong></span>
                )}
              </div>
              {item.location && (
                <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{item.location}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {isAvailable ? (
                <>
                  <Button
                    onClick={() => setShowBorrowModal(true)}
                    variant="primary"
                    className="flex-1"
                  >
                    {item.is_borrowable ? 'Pinjam' : 'Ambil'}
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    size="sm"
                    className="px-3"
                    title={isInCart(item.id) ? 'Sudah di keranjang' : 'Tambah ke keranjang'}
                  >
                    <ShoppingCart className={`h-4 w-4 ${isInCart(item.id) ? 'fill-primary-600 text-primary-600' : ''}`} />
                  </Button>
                </>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed border border-gray-200"
                >
                  Stok Habis
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested Borrow Modal */}
      {showBorrowModal && (
        <BorrowModal
          initialItems={[{
            id: item.id,
            name: item.name,
            stock_available: item.stock_available,
            is_borrowable: item.is_borrowable,
          }]}
          onClose={() => setShowBorrowModal(false)}
        />
      )}
    </>
  )
}
