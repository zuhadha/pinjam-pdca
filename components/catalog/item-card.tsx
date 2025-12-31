'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Item } from '@/lib/actions/item-actions'
import { Badge } from '@/components/ui/badge'
import { BorrowModal } from '@/components/borrow/borrow-modal'
import { MagicBento } from '@/components/ui/magic-bento'
import { ImageCarousel } from './image-carousel'
import { useCart } from '@/components/cart/cart-context'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Package2 } from 'lucide-react'

interface ItemCardProps {
  item: Item
  showBorrowButton?: boolean
}

export function ItemCard({ item, showBorrowButton = true }: ItemCardProps) {
  const isAvailable = item.stock_available > 0
  const sensitiveLabel = item.is_sensitive ? 'Sensitif' : ''
  const [showModal, setShowModal] = useState(false)
  const { addItem, isInCart } = useCart()

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      quantity: 1,
      stock_available: item.stock_available,
      // category: item.category,
      images: item.images || [],
      is_sensitive: item.is_sensitive,
    })
  }

  return (
    <>
      <MagicBento className="rounded-lg p-[4px]">
        <Link href={`/catalog/${item.id}`} className="block">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full cursor-pointer">
        {/* Item Image */}
        <div className="relative">
          <ImageCarousel
            images={item.images || []}
            imageClassName="h-48"
          />
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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
            {item.name}
          </h3>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Stock Info */}
          <div className="flex items-center justify-between mb-4 text-sm gap-x-2">
            <div className="text-gray-500 px-3 py-1.5 bg-gray-100 rounded-md flex items-center leading-none border border-gray-200">
              <Package2 className="h-4 w-4 mr-1" />
              <strong className="text-gray-900 mr-1 leading-none">{item.stock_available}</strong> /{item.stock_total}
            </div>
            {item.location && (
              <div className="text-gray-500 text-sm leading-none px-3 py-1.5 bg-gray-100 rounded-md flex-1 border border-gray-200 truncate">
                📍 {item.location}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showBorrowButton && (
            <div className="space-y-2">
              {isAvailable ? (
                <>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowModal(true); }}
                      className="flex-1 py-auto bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
                    >
                      Pinjam Barang
                    </button>
                    <Button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(); }}
                      variant="outline"
                      size="sm"
                      className="px-3"
                      title={isInCart(item.id) ? "Sudah di keranjang" : "Tambah ke keranjang"}
                    >
                      <ShoppingCart className={`h-4 w-4 ${isInCart(item.id) ? 'fill-primary-600' : ''}`} />
                    </Button>
                  </div>
                </>
              ) : (
                <button 
                  disabled 
                  className="w-full py-2.5 bg-gray-300 text-gray-500 rounded-md font-medium cursor-not-allowed"
                >
                  Stok Habis
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </Link>
      </MagicBento>

      {/* Borrow Modal */}
      {showModal && (
        <BorrowModal
          initialItems={[{
            id: item.id,
            name: item.name,
            stock_available: item.stock_available
          }]}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
