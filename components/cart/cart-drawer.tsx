'use client'

import { useCart } from '@/components/cart/cart-context'
import { X, Plus, Minus, ShoppingCart as CartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function CartDrawer() {
  const { items, itemCount, removeItem, updateQuantity, toggleUnit, clearCart, isCartOpen, closeCart } = useCart()

  if (!isCartOpen && itemCount === 0) return null

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Keranjang ({itemCount})
          </h2>
          <button
            onClick={closeCart}
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
                <Button className="mt-4" onClick={closeCart}>
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

                  {item.is_borrowable && item.availableUnits && item.availableUnits.length > 0 ? (
                    {/* Unit Selection instead of Quantity */}
                    <div className="mt-2 space-y-1">
                      <span className="text-xs font-medium text-gray-700">Pilih Unit:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.availableUnits.map(unit => {
                          const isSelected = item.selectedUnits?.some(u => u.id === unit.id)
                          return (
                            <label 
                              key={unit.id} 
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-primary-50 border-primary-500 text-primary-700' 
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected || false}
                                onChange={() => toggleUnit(item.id, unit.id, unit.code)}
                                className="h-3 w-3 text-primary-600 rounded border-gray-300 cursor-pointer"
                              />
                              {unit.code}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col gap-2">
                      {item.is_borrowable && (
                        <div className="text-[10px] sm:text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                          Admin belum memasukkan kode unit. Anda bisa mengatur secara kuantitas:
                        </div>
                      )}
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
                  )}
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
            <Link href="/cart" onClick={closeCart}>
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
