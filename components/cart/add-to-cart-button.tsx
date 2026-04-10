'use client'

import { useCart } from '@/components/cart/cart-context'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

interface AddToCartButtonProps {
  item: {
    id: string
    name: string
    stock_available: number
    is_borrowable: boolean
    category?: {
      id: string
     name: string
      icon: string | null
    } | null
    images: Array<{
      id: string
      image_url: string
      display_order: number
    }>
    units?: Array<{
      id: string
      code: string
      is_available: boolean
    }>
  }
}

export function AddToCartButton({ item }: AddToCartButtonProps) {
  const { addItem, isInCart } = useCart()

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      quantity: 1,
      stock_available: item.stock_available,
      category: item.category ? {
        id: item.category.id,
        name: item.category.name,
        icon: item.category.icon ?? ''
      } : undefined,
      images: item.images || [],
      availableUnits: item.units?.filter((u: any) => u.is_available) || [],
      selectedUnits: [],
      is_borrowable: item.is_borrowable ?? true,
    })
  }

  return (
    <Button
      onClick={handleAddToCart}
      variant="outline"
      size="lg"
      className="flex-1"
    >
      <ShoppingCart className={`mr-2 h-5 w-5 ${isInCart(item.id) ? 'fill-primary-600' : ''}`} />
      {isInCart(item.id) ? 'Di Keranjang' : 'Tambah ke Keranjang'}
    </Button>
  )
}
