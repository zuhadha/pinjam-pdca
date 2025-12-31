'use client'

import { useCart } from '@/components/cart/cart-context'
import { X, Plus, Minus, ShoppingCart as CartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

export function CartDrawer() {
  const { items, itemCount, removeItem, updateQuantity, clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen && itemCount === 0) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Keranjang ({itemCount})
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <CartIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Keranjang masih kosong</p>
              <Link href="/catalog">
                <Button className="mt-4" onClick={() => setIsOpen(false)}>
                  Lihat Katalog
                </Button>
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                {/* Image */}
                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0].image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {item.category?.icon || '📦'}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Stok: {item.stock_available}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={item.quantity >= item.stock_available}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 hover:bg-red-100 rounded-full text-red-600 h-fit"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <Link href="/cart" onClick={() => setIsOpen(false)}>
              <Button className="w-full" size="lg">
                Pinjam Sekarang ({itemCount} barang)
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={clearCart}
            >
              Kosongkan Keranjang
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
