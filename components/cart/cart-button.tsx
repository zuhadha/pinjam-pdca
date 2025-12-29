'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/cart/cart-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function CartButton() {
  const { itemCount } = useCart()
  const [pulse, setPulse] = useState(false)

  // Pulse animation when item count changes
  useEffect(() => {
    if (itemCount > 0) {
      setPulse(true)
      const timeout = setTimeout(() => setPulse(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [itemCount])

  return (
    <Link href="/cart">
      <Button variant="ghost" size="sm" className="relative">
        <ShoppingCart className={`h-5 w-5 ${pulse ? 'animate-bounce' : ''}`} />
        
        {itemCount > 0 && (
          <span className={`
            absolute -top-1 -right-1 
            bg-primary-600 text-white text-xs font-bold
            rounded-full h-5 w-5
            flex items-center justify-center
            ${pulse ? 'scale-125' : 'scale-100'}
            transition-transform duration-300
          `}>
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Button>
    </Link>
  )
}
