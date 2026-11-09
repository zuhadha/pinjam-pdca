'use client'

import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react'
import type { Item } from '@/lib/actions/item-actions'
import { ItemDetailModal } from './item-detail-modal'

interface ItemDetailContextType {
  openItem: (item: Item) => void
  closeItem: () => void
}

const ItemDetailContext = createContext<ItemDetailContextType | undefined>(undefined)

export function ItemDetailProvider({ children }: { children: ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  // Stable value: opening/closing the modal no longer re-renders every item card
  const openItem = useCallback((item: Item) => setSelectedItem(item), [])
  const closeItem = useCallback(() => setSelectedItem(null), [])
  const value = useMemo(() => ({ openItem, closeItem }), [openItem, closeItem])

  return (
    <ItemDetailContext.Provider value={value}>
      {children}
      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem} 
          onClose={closeItem} 
        />
      )}
    </ItemDetailContext.Provider>
  )
}

export function useItemDetail() {
  const context = useContext(ItemDetailContext)
  if (context === undefined) {
    throw new Error('useItemDetail must be used within an ItemDetailProvider')
  }
  return context
}
