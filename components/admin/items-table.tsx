'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { deleteItem } from '@/lib/actions/item-management-actions'
import { Edit, Trash2, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'

interface ItemsTableProps {
  items: any[]
}

export function ItemsTable({ items }: ItemsTableProps) {
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; itemId: string | null; itemName: string }>({
    open: false,
    itemId: null,
    itemName: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleDeleteClick = (itemId: string, itemName: string) => {
    setDeleteDialog({ open: true, itemId, itemName })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.itemId) return

    setDeleteLoading(deleteDialog.itemId)
    const result = await deleteItem(deleteDialog.itemId)
    setDeleteLoading(null)
    setDeleteDialog({ open: false, itemId: null, itemName: '' })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.message || 'Barang berhasil dihapus')
    }
  }

  // Filter and search logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          item.name.toLowerCase().includes(searchLower) ||
          (item.description && item.description.toLowerCase().includes(searchLower)) ||
          (item.location && item.location.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }

      // Category filter
      if (categoryFilter !== 'all' && item.category_id !== categoryFilter) {
        return false
      }

      // Type filter (borrowable vs requestable)
      if (typeFilter === 'borrowable' && !item.is_borrowable) {
        return false
      }
      if (typeFilter === 'requestable' && item.is_borrowable) {
        return false
      }

      // Location filter
      if (locationFilter !== 'all' && item.location !== locationFilter) {
        return false
      }

      return true
    })
  }, [items, searchQuery, categoryFilter, typeFilter, locationFilter])

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, typeFilter, locationFilter])

  // Get unique categories from items
  const categories = useMemo(() => {
    const categoryMap = new Map()
    items.forEach(item => {
      if (item.category) {
        categoryMap.set(item.category.id, item.category.name)
      }
    })
    return Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  // Get unique locations from items
  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>()
    items.forEach(item => {
      if (item.location && item.location.trim()) {
        locSet.add(item.location.trim())
      }
    })
    return Array.from(locSet).sort()
  }, [items])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Cari nama, deskripsi, atau lokasi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-auto leading-none text-sm sm:max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="borrowable">Pinjaman</SelectItem>
            <SelectItem value="requestable">Permintaan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Semua Lokasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Lokasi</SelectItem>
            {uniqueLocations.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-600 flex items-center ml-auto">
          {filteredItems.length} barang
        </div>
      </div>

      {paginatedItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📦</div>
          <p>Tidak ada barang ditemukan</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedItems.map((item) => {
                  const stockPercentage = item.stock_total > 0 
                    ? (item.stock_available / item.stock_total) * 100 
                    : 0
                  const isLowStock = stockPercentage < 20 && item.stock_total > 0

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.images?.[0]?.image_url ? (
                            <img
                              src={item.images[0].image_url}
                              alt={item.name}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">
                              📦
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">{item.description}</div>
                            )}
                            {item.location && (
                              <div className="text-[10px] font-medium text-primary-600 uppercase tracking-tight mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.category ? item.category.name : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={item.is_borrowable ? 'default' : 'secondary'}>
                          {item.is_borrowable ? 'Pinjaman' : 'Permintaan'}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className={`font-medium ${item.stock_available === 0 ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'}`}>
                            {item.stock_available}/{item.stock_total}
                          </span>
                          {item.stock_available === 0 && (
                            <span className="text-xs text-red-600">Habis</span>
                          )}
                          {isLowStock && item.stock_available > 0 && (
                            <span className="text-xs text-yellow-600">Rendah</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/items/edit/${item.id}`}>
                            <button 
                              className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                              title="Edit Barang"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(item.id, item.name)}
                            disabled={deleteLoading === item.id}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                            title="Hapus Barang"
                          >
                            {deleteLoading === item.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="w-full pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, itemId: null, itemName: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Barang?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus barang &quot;{deleteDialog.itemName}&quot;? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              {deleteLoading ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
