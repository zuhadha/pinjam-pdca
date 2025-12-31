'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/actions/item-actions'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  const applyFilters = (newSearch: string, newCategoryId: string, newAvailableOnly: boolean) => {
    const params = new URLSearchParams()
    
    if (newSearch) params.set('search', newSearch)
    if (newCategoryId) params.set('category', newCategoryId)
    if (newAvailableOnly) params.set('available', 'true')

    startTransition(() => {
      router.push(`/catalog?${params.toString()}`)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    applyFilters(value, categoryId, availableOnly)
  }

  const handleCategoryChange = (value: string) => {
    const newValue = value === 'all' ? '' : value
    setCategoryId(newValue)
    applyFilters(search, newValue, availableOnly)
  }

  const handleAvailableToggle = () => {
    const newValue = !availableOnly
    setAvailableOnly(newValue)
    applyFilters(search, categoryId, newValue)
  }

  const resetFilters = () => {
    setSearch('')
    setCategoryId('')
    setAvailableOnly(false)
    startTransition(() => {
      router.push('/catalog')
    })
  }

  const hasActiveFilters = search || categoryId || availableOnly

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Single Row with All Filters */}
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
            <SelectTrigger>
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available Only Toggle */}
        <Button
          variant={availableOnly ? 'default' : 'outline'}
          size="sm"
          onClick={handleAvailableToggle}
          className="whitespace-nowrap px-4"
        >
          {availableOnly ? '✓ ' : ''}Tersedia
        </Button>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="whitespace-nowrap px-3"
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
  )
}
