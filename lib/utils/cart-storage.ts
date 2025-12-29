// Cart localStorage utilities
import { Cart, CartItem } from '@/lib/types/cart'

const CART_STORAGE_KEY = 'pinjam_pdca_cart'

export function getCartFromStorage(): Cart {
  if (typeof window === 'undefined') {
    return { items: [], updatedAt: new Date().toISOString() }
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) {
      return { items: [], updatedAt: new Date().toISOString() }
    }

    const cart: Cart = JSON.parse(stored)
    return cart
  } catch (error) {
    console.error('Error reading cart from localStorage:', error)
    return { items: [], updatedAt: new Date().toISOString() }
  }
}

export function saveCartToStorage(cart: Cart): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      ...cart,
      updatedAt: new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error saving cart to localStorage:', error)
  }
}

export function clearCartStorage(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(CART_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error)
  }
}
