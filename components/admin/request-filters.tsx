'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function RequestFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')

  const applyFilters = (newSearch: string, newStatus: string) => {
    const params = new URLSearchParams()
    
    if (newSearch) params.set('search', newSearch)
    if (newStatus) params.set('status', newStatus)

    startTransition(() => {
      router.push(`/admin/requests?${params.toString()}`)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    applyFilters(value, status)
  }

  const handleStatusChange = (value: string) => {
    const newValue = value === 'all' ? '' : value
    setStatus(newValue)
    applyFilters(search, newValue)
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    startTransition(() => {
      router.push('/admin/requests')
    })
  }

  const hasActiveFilters = search || status

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Single Row with All Filters */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama peminjam atau barang..."
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

        {/* Status Filter Dropdown */}
        <div className="w-48">
          <Select
            value={status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="borrowed">Dipinjam</SelectItem>
              <SelectItem value="returned">Dikembalikan</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
