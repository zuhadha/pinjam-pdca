'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { Item } from '@/lib/actions/item-actions'
import { ItemDetailModal } from './item-detail-modal'

interface ItemDetailContextType {
  openItem: (item: Item) => void
  closeItem: () => void
}

const ItemDetailContext = createContext<ItemDetailContextType | undefined>(undefined)

export function ItemDetailProvider({ children }: { children: ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const openItem = (item: Item) => setSelectedItem(item)
  const closeItem = () => setSelectedItem(null)

  return (
    <ItemDetailContext.Provider value={{ openItem, closeItem }}>
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
