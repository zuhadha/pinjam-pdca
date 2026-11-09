'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/actions/item-actions'
import { Search, X, ShoppingBag, User, ArrowLeft, SlidersHorizontal, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart/cart-context'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCategoryIcon } from '@/lib/category-icons'
import { useRestoreSearchParams } from '@/lib/hooks/use-restore-search-params'

interface SearchFiltersProps {
  categories: Category[]
}

export function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '')
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available') === 'true')
  const [borrowType, setBorrowType] = useState(searchParams.get('type') || 'all')

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Bring back the last catalog filters when returning to /catalog without any
  useRestoreSearchParams('catalog-filters')

  // Sync inputs when the URL changes from outside (restore, back button, links),
  // but not for our own pushes, so fast typing isn't overwritten.
  const query = searchParams.toString()
  const [lastPushed, setLastPushed] = useState(query)
  const [seenQuery, setSeenQuery] = useState(query)
  if (query !== seenQuery) {
    setSeenQuery(query)
    if (query !== lastPushed) {
      setLastPushed(query)
      setSearch(searchParams.get('search') || '')
      setCategoryId(searchParams.get('category') || '')
      setAvailableOnly(searchParams.get('available') === 'true')
      setBorrowType(searchParams.get('type') || 'all')
    }
  }

  const applyFilters = (newSearch: string, newCategoryId: string, newAvailableOnly: boolean, newType: string) => {
    // Any direct apply supersedes a pending debounced search
    clearPendingSearch()
    const params = new URLSearchParams()
    
    if (newSearch) params.set('search', newSearch)
    if (newCategoryId) params.set('category', newCategoryId)
    if (newAvailableOnly) params.set('available', 'true')
    if (newType !== 'all') params.set('type', newType)

    setShowMobileFilters(false) // Close overlay on apply
    setLastPushed(params.toString())
    startTransition(() => {
      router.push(`/catalog?${params.toString()}`)
    })
  }

  // Typing updates the input instantly; the URL (and server query) waits until
  // typing pauses, instead of one server round trip per keystroke.
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearPendingSearch = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = null
  }
  useEffect(() => () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    clearPendingSearch()
    if (!value) {
      // Clearing the search applies right away
      applyFilters(value, categoryId, availableOnly, borrowType)
      return
    }
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null
      applyFilters(value, categoryId, availableOnly, borrowType)
    }, 300)
  }

  const handleCategoryChange = (value: string) => {
    const newValue = value === 'all' ? '' : value
    setCategoryId(newValue)
    applyFilters(search, newValue, availableOnly, borrowType)
  }

  const handleAvailableToggle = () => {
    const newValue = !availableOnly
    setAvailableOnly(newValue)
    applyFilters(search, categoryId, newValue, borrowType)
  }

  const handleTypeChange = (value: string) => {
    setBorrowType(value)
    applyFilters(search, categoryId, availableOnly, value)
  }

  const resetFilters = () => {
    setSearch('')
    setCategoryId('')
    setAvailableOnly(false)
    setBorrowType('all')
    setShowMobileFilters(false)
    setLastPushed('')
    startTransition(() => {
      router.push('/catalog')
    })
  }

  const { items: cartItems, openCart } = useCart()
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const hasActiveFilters = search || categoryId || availableOnly || borrowType !== 'all'

  return (
    <div className="mb-6">
      {/* --- MOBILE UI --- */}
      <div className="block lg:hidden">
        {/* Mobile Header: Two States */}
        {!hasActiveFilters ? (
          /* State 1: No Filter - Primary Blue Header */
          <div className="fixed top-0 left-0 right-0 z-[60] bg-primary-600 px-4 py-3 flex items-center gap-3">
            <div className="relative flex-1 bg-white rounded-md flex items-center px-3 py-1.5 shadow-sm">
              <Search className="h-4 w-4 text-primary-600 mr-2" />
              <input
                type="text"
                placeholder="Cari di Katalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters(search, categoryId, availableOnly, borrowType)}
                className="w-full text-sm outline-none placeholder:text-primary-300 text-primary-600"
              />
            </div>
            <button className="relative p-1" onClick={() => setShowMobileFilters(!showMobileFilters)}>
              <SlidersHorizontal className={cn("h-6 w-6 text-white transition-transform", showMobileFilters ? "rotate-90" : "")} />
            </button>
            <button className="relative p-1" onClick={openCart}>
              <ShoppingBag className="h-6 w-6 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-primary-600 text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-primary-600">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        ) : (
          /* State 2: Filter Active - White Header */
          <div className="fixed top-0 left-0 right-0 z-[60] bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-3 shadow-sm transition-all duration-300">
            <button onClick={resetFilters} className="p-1">
              <ArrowLeft className="h-6 w-6 text-primary-600" />
            </button>
            <div className="relative flex-1 bg-gray-100 rounded-sm flex items-center px-3 py-1.5">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters(search, categoryId, availableOnly, borrowType)}
                className="w-full text-sm outline-none bg-transparent"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X className="h-4 w-4 text-gray-400 ml-1" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)} 
              className={cn("p-1 transition-all", showMobileFilters ? "text-primary-600 rotate-90" : (hasActiveFilters ? "text-primary-600" : "text-gray-400"))}
            >
              <SlidersHorizontal className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Mobile Filters Overlay (Wipe Down) */}
        <div 
          className={cn(
            "fixed inset-x-0 top-0 z-[55] bg-white shadow-2xl transition-all duration-500 ease-in-out overflow-y-auto rounded-b-[32px] pt-[56px] lg:pt-0",
            showMobileFilters ? "max-h-[85vh] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-full"
          )}
        >
          <div className="p-5 pb-4 space-y-6">
            <div className="space-y-5">
              {/* Category Select */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Kategori Barang</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCategoryId('')}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center",
                      categoryId === '' ? "bg-primary-50 border-primary-600 text-primary-600" : "border-gray-100 text-gray-500 bg-gray-50/50"
                    )}
                  >
                    Semua Kategori
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center truncate",
                        categoryId === cat.id ? "bg-primary-50 border-primary-600 text-primary-600" : "border-gray-100 text-gray-500 bg-gray-50/50"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Borrow Type Select */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Jenis Peminjaman</label>
                <div className="flex gap-2">
                  {['all', 'pinjam', 'minta'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setBorrowType(type)}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all capitalize",
                        borrowType === type ? "bg-primary-50 border-primary-600 text-primary-600" : "border-gray-100 text-gray-500 bg-gray-50/50"
                      )}
                    >
                      {type === 'all' ? 'Semua' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Only */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 border border-gray-100">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-gray-900">Hanya Stok Tersedia</p>
                  <p className="text-[10px] text-gray-500">Sembunyikan barang yang sedang kosong</p>
                </div>
                <button
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    availableOnly ? "bg-primary-600" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    availableOnly ? "left-6" : "left-1"
                  )} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1 h-12 text-gray-400 font-bold" onClick={resetFilters}>Reset</Button>
              <Button 
                className="flex-[2] h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-100"
                onClick={() => applyFilters(search, categoryId, availableOnly, borrowType)}
              >
                Terapkan Filter
              </Button>
            </div>
          </div>
          
          {/* Bottom Handle Bar indicator */}
          <div className="flex justify-center pb-3">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
          </div>
        </div>
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/40 z-[50]" onClick={() => setShowMobileFilters(false)} />
        )}

        {/* Categories Scroll (Mobile Only, Only when no filter) */}
        {!hasActiveFilters && (
          <div className="border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide py-2">
            {categories.map((cat) => {
              const IconComp = cat.icon && getCategoryIcon(cat.icon)
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 group transition-transform active:scale-95 w-14"
                >
                  <div className="w-11 h-11 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-xl group-hover:border-primary-200 transition-colors shadow-sm">
                    {IconComp ? <IconComp className="h-6 w-6 text-primary-600" /> : (cat.icon || '📦')}
                  </div>
                  <span className="text-[10px] text-gray-600 text-center leading-tight line-clamp-2 w-full">
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* --- DESKTOP UI (Original with slight orange tweaks) --- */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-48">
            <Select
              value={categoryId || 'all'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="focus:ring-primary-600">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => {
                  const IconComp = cat.icon && getCategoryIcon(cat.icon)
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        {IconComp ? <IconComp className="h-4 w-4" /> : cat.icon && <span className="mr-1">{cat.icon}</span>}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Type Dropdown (Pinjam/Minta) */}
          <div className="w-40">
            <Select
              value={borrowType}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="focus:ring-primary-600">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="pinjam">Peminjaman</SelectItem>
                <SelectItem value="minta">Permintaan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Available Only Toggle */}
          <Button
            variant={availableOnly ? 'default' : 'outline'}
            size="sm"
            onClick={handleAvailableToggle}
            className={cn(
              "whitespace-nowrap px-4 border-gray-300 transition-all",
              availableOnly ? "bg-primary-600 hover:bg-primary-700 text-white border-primary-600" : ""
            )}
          >
            {availableOnly ? '✓ ' : ''}Tersedia
          </Button>

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="whitespace-nowrap px-3 text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="Reset filter"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Loading Indicator */}
        {isPending && (
          <div className="mt-3 text-center text-sm text-gray-600">
            Memuat...
          </div>
        )}
      </div>
    </div>
  )
}
