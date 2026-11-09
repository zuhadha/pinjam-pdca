'use client'

import { useState } from 'react'
import { BorrowModal } from './borrow-modal'
import type { Item } from '@/lib/actions/item-actions'

interface BorrowButtonProps {
  item: Item
  isAvailable: boolean
}

export function BorrowButton({ item, isAvailable }: BorrowButtonProps) {
  const [showModal, setShowModal] = useState(false)

  if (!isAvailable) {
    return (
      <button
        disabled
        className="w-full py-3 bg-gray-300 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
      >
        Stok Habis
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        {item.is_borrowable ? 'Pinjam' : 'Ambil'}
      </button>

      {showModal && (
        <BorrowModal
          initialItems={[{
            id: item.id,
            name: item.name,
            stock_available: item.stock_available,
            is_borrowable: item.is_borrowable,
            units: item.units,
          }]}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
