// Cart types and interfaces
export interface CartItem {
  id: string // item.id
  name: string
  quantity: number
  stock_available: number
  category?: {
    id: string
    name: string
    icon: string | null
  }
  images: Array<{
    id: string
    image_url: string
    display_order: number
  }>
  availableUnits?: Array<{
    id: string
    code: string
    is_available: boolean
  }>
  selectedUnits?: Array<{id: string, code: string}>
  is_borrowable: boolean
  addedAt: string // ISO date string
}

export interface Cart {
  items: CartItem[]
  updatedAt: string
}
