'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem } from '@/lib/types/cart'
import { getCartFromStorage, saveCartToStorage, clearCartStorage } from '@/lib/utils/cart-storage'
import { toast } from 'sonner'

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  addItem: (item: Omit<CartItem, 'addedAt'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (itemId: string) => boolean
  getItemQuantity: (itemId: string) => number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const cart = getCartFromStorage()
    setItems(cart.items)
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveCartToStorage({ items, updatedAt: new Date().toISOString() })
    }
  }, [items, isHydrated])

  const addItem = (item: Omit<CartItem, 'addedAt'>) => {
    setItems(prev => {
      // Check if cart has items with different type
      if (prev.length > 0) {
        const existingType = prev[0].is_borrowable
        if (existingType !== item.is_borrowable) {
          const existingTypeName = existingType ? 'peminjaman' : 'permintaan'
          const newTypeName = item.is_borrowable ? 'peminjaman' : 'permintaan'
          toast.error(
            `Tidak bisa mencampur barang ${existingTypeName} dan ${newTypeName}`,
            {
              description: 'Silakan checkout atau kosongkan keranjang terlebih dahulu'
            }
          )
          return prev
        }
      }
      
      // Check if item already in cart
      const existing = prev.find(i => i.id === item.id)
      
      if (existing) {
        // Update quantity (up to stock limit)
        const newQuantity = Math.min(
          existing.quantity + item.quantity,
          item.stock_available
        )
        
        if (newQuantity === existing.quantity) {
          toast.warning(`${item.name} sudah mencapai maksimal stok yang tersedia`)
          return prev
        }

        toast.success(`${item.name} qty diupdate menjadi ${newQuantity}`)
        
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: newQuantity }
            : i
        )
      }

      // Add new item
      toast.success(`${item.name} ditambahkan ke keranjang`)
      return [...prev, { ...item, addedAt: new Date().toISOString() }]
    })
  }

  const removeItem = (itemId: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === itemId)
      if (item) {
        toast.success(`${item.name} dihapus dari keranjang`)
      }
      return prev.filter(i => i.id !== itemId)
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.min(quantity, item.stock_available)
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
    clearCartStorage()
    toast.success('Keranjang dikosongkan')
  }

  const isInCart = (itemId: string) => {
    return items.some(item => item.id === itemId)
  }

  const getItemQuantity = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    return item?.quantity || 0
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
