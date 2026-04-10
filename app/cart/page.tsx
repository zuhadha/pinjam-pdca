'use client'

import { useCart } from '@/components/cart/cart-context'
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CartCheckoutForm } from '@/components/cart/cart-checkout-form'

export default function CartPage() {
  const { items, itemCount, removeItem, updateQuantity, toggleUnit, clearCart } = useCart()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Keranjang Peminjaman</h1>
          <p className="text-gray-600 mt-2">
            {itemCount > 0 ? `${itemCount} barang di keranjang` : 'Keranjang kosong'}
          </p>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCart className="h-24 w-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Keranjang Anda kosong
            </h2>
            <p className="text-gray-600 mb-6">
              Mulai tambahkan barang dari katalog untuk dipinjam
            </p>
            <Link href="/catalog">
              <Button size="lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Lihat Katalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="divide-y-2 text-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0].image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {item.category?.icon || '📦'}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg mb-1 flex gap-2">
                              {item.name}
                              {item.category && (
                                <Badge variant={'warning'} className='py-1 leading-none'>
                                  {item.category.name}
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">
                              Stok tersedia: {item.stock_available}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 h-fit"
                            title="Hapus dari keranjang"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        {item.is_borrowable && item.availableUnits && item.availableUnits.length > 0 ? (
                          <div className="flex flex-col gap-2 text-slate-500">
                            <span className="text-sm font-medium text-gray-700">Pilih Unit Barang:</span>
                            <div className="flex flex-wrap gap-2">
                              {item.availableUnits.map(unit => {
                                const isSelected = item.selectedUnits?.some(u => u.id === unit.id)
                                return (
                                  <label 
                                    key={unit.id} 
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded border text-sm cursor-pointer transition-colors ${
                                      isSelected 
                                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected || false}
                                      onChange={() => toggleUnit(item.id, unit.id, unit.code)}
                                      className="h-4 w-4 text-primary-600 rounded border-gray-300 cursor-pointer"
                                    />
                                    {unit.code}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {item.is_borrowable && (
                              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                Admin belum memasukkan kode unit. Anda dapat mengatur secara kuantitas:
                              </div>
                            )}
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3 text-slate-500">
                              <span className="text-sm text-gray-600">Jumlah:</span>
                              <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-4 text-center font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1 hover:bg-gray-100 rounded-r-lg transition-colors"
                                  disabled={item.quantity >= item.stock_available}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkout Form */}
            <CartCheckoutForm />
          </div>
        )}
      </div>
    </div>
  )
}
