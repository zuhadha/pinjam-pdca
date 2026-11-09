'use client'

import { useCart } from '@/components/cart/cart-context'
import { X, Plus, Minus, ShoppingBag as BagIcon, ArrowLeft, Trash2, ArrowRight } from 'lucide-react'
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
          className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer Container */}
      <div
        className={`
          fixed z-[101] bg-white shadow-2xl transition-all duration-500 ease-in-out
          /* Mobile: Bottom Sheet */
          bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl
          lg:top-0 lg:right-0 lg:left-auto lg:h-full lg:w-[400px] lg:rounded-none
          ${isCartOpen 
            ? 'translate-y-0 lg:translate-x-0 lg:translate-y-0' 
            : 'translate-y-full lg:translate-x-full lg:translate-y-0'
          }
        `}
      >
        <div className="flex flex-col h-full relative">
          {/* Mobile Handle Bar */}
          <div className="lg:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-4 lg:p-6 bg-white rounded-t-3xl lg:rounded-none">
            <div className="flex items-center gap-3">
              <button onClick={closeCart} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                <ArrowLeft className="h-6 w-6 lg:hidden" />
                <X className="h-6 w-6 hidden lg:block" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">Tas Peminjaman</h2>
            </div>
            <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
              {itemCount} Barang
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 no-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <BagIcon className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium italic">Tas Anda masih kosong...</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-primary-100 transition-colors">
                  <div className="flex gap-4">
                    {/* Item Image holder */}
                    <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.images?.[0] ? (
                        <img loading="lazy" decoding="async" src={item.images[0].image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-primary-50">
                          {item.category?.icon || '📦'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{item.name}</h3>
                        <p className="text-xs text-gray-500">Stok tersedia: {item.stock_available}</p>
                      </div>

                      {/* Quantity Logic */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-colors disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 text-sm font-bold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-colors disabled:opacity-30"
                            disabled={item.quantity >= item.stock_available}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer (Sticky & Modern) */}
          {items.length > 0 && (
            <div className="bg-white p-6 lg:p-8 space-y-4">
              <div className="flex flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 lg:h-14 border-gray-200 text-gray-600 font-bold text-sm lg:text-base hover:bg-gray-50 rounded-xl"
                  onClick={clearCart}
                >
                  <Trash2 className="h-5 w-5 mr-2 hidden sm:block" />
                  Kosongkan
                </Button>
                
                <Link href="/cart" onClick={closeCart} className="flex-[2]">
                  <Button className="w-full h-12 lg:h-14 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm lg:text-base shadow-lg shadow-primary-200 rounded-xl flex items-center justify-center gap-2">
                    Pinjam Sekarang
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
