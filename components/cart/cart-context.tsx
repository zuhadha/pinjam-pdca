'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem } from '@/lib/types/cart'
import { getCartFromStorage, saveCartToStorage, clearCartStorage } from '@/lib/utils/cart-storage'
import { toast } from 'sonner'
import { toggleUnitInSelection, trimSelection } from '@/lib/utils/unit-selection'

// Items with unit codes can't exceed the number of codes that were available
function maxQuantityFor(item: Pick<CartItem, 'is_borrowable' | 'availableUnits' | 'stock_available'>) {
  const unitCount = item.availableUnits?.length || 0
  return item.is_borrowable && unitCount > 0 ? unitCount : item.stock_available
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (item: Omit<CartItem, 'addedAt'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  toggleUnit: (itemId: string, unitId: string, unitCode: string) => void
  clearCart: () => void
  isInCart: (itemId: string) => boolean
  getItemQuantity: (itemId: string) => number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

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
    // Check if cart has items with different type
    if (items.length > 0) {
      const existingType = items[0].is_borrowable
      if (existingType !== item.is_borrowable) {
        const existingTypeName = existingType ? 'peminjaman' : 'permintaan'
        const newTypeName = item.is_borrowable ? 'peminjaman' : 'permintaan'
        toast.error(
          `Tidak bisa mencampur barang ${existingTypeName} dan ${newTypeName}`,
          {
            description: 'Silakan pinjam atau kosongkan keranjang terlebih dahulu'
          }
        )
        return
      }
    }
    
    // Check if item already in cart
    const existing = items.find(i => i.id === item.id)
    
    if (existing) {
      // Update quantity (up to stock limit)
      const newQuantity = Math.min(
        existing.quantity + item.quantity,
        maxQuantityFor(item)
      )
      
      if (newQuantity === existing.quantity) {
        toast.warning(`${item.name} sudah mencapai maksimal stok yang tersedia`)
        return
      }

      toast.success(`${item.name} qty diupdate menjadi ${newQuantity}`)
      
      setItems(prev => prev.map(i =>
        i.id === item.id
          ? { ...i, quantity: newQuantity }
          : i
      ))
    } else {
      // Add new item
      toast.success(`${item.name} ditambahkan ke keranjang`)
      setItems(prev => [...prev, { ...item, addedAt: new Date().toISOString() }])
    }
  }

  const removeItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      toast.success(`${item.name} dihapus dari keranjang`)
    }
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    // Legacy support or fallback
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.min(quantity, maxQuantityFor(item))
          return {
            ...item,
            quantity: newQuantity,
            selectedUnits: trimSelection(item.selectedUnits, newQuantity),
          }
        }
        return item
      })
    )
  }

  const toggleUnit = (itemId: string, unitId: string, unitCode: string) => {
    const current = items.find(i => i.id === itemId)
    if (!current) return

    const next = toggleUnitInSelection(
      current.selectedUnits || [],
      { id: unitId, code: unitCode },
      current.quantity
    )
    if (!next) {
      toast.warning(`Sudah memilih ${current.quantity} kode. Tambah jumlah untuk memilih lebih banyak.`)
      return
    }

    setItems(prev => prev.map(item => (item.id === itemId ? { ...item, selectedUnits: next } : item)))
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
        isCartOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        toggleUnit,
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
