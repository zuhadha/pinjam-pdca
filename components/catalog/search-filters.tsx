'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/actions/item-actions'

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    if (search) params.set('search', search)
    if (categoryId) params.set('category', categoryId)
    if (availableOnly) params.set('available', 'true')

    startTransition(() => {
      router.push(`/catalog?${params.toString()}`)
    })
  }

  const resetFilters = () => {
    setSearch('')
    setCategoryId('')
    setAvailableOnly(false)
    startTransition(() => {
      router.push('/catalog')
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Cari Barang
          </label>
          <div className="relative">
            <input
              id="search"
              type="text"
              placeholder="Cari nama barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              🔍
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                // Auto-apply when changed
                const params = new URLSearchParams()
                if (search) params.set('search', search)
                if (e.target.value) params.set('category', e.target.value)
                if (availableOnly) params.set('available', 'true')
                startTransition(() => {
                  router.push(`/catalog?${params.toString()}`)
                })
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Available Only Toggle */}
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors w-full">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => {
                  setAvailableOnly(e.target.checked)
                  // Auto-apply when changed
                  const params = new URLSearchParams()
                  if (search) params.set('search', search)
                  if (categoryId) params.set('category', categoryId)
                  if (e.target.checked) params.set('available', 'true')
                  startTransition(() => {
                    router.push(`/catalog?${params.toString()}`)
                  })
                }}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Hanya yang Tersedia
              </span>
            </label>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </form>

      {isPending && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Memuat...
        </div>
      )}
    </div>
  )
}
