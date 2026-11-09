'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteCategory } from '@/lib/actions/item-management-actions'
import { Edit, Trash2, Loader2, Link as LinkIcon } from 'lucide-react'
import { getCategoryIcon } from '@/lib/category-icons'
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
import { Pagination } from '@/components/ui/pagination'
import { useSessionState } from '@/lib/hooks/use-session-state'

interface CategoriesTableProps {
  categories: any[]
  onEdit?: (category: any) => void
}

export function CategoriesTable({ categories, onEdit }: CategoriesTableProps) {
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoryId: string | null; categoryName: string }>({
    open: false,
    categoryId: null,
    categoryName: '',
  })
  // Kept in sessionStorage so the search survives leaving and coming back
  const [filters, setFilters] = useSessionState('admin-categories-filters', { search: '', page: 1 })
  const searchQuery = filters.search
  const setSearchQuery = (search: string) => setFilters({ search, page: 1 })
  const setCurrentPage = (page: number) => setFilters(prev => ({ ...prev, page }))
  const itemsPerPage = 10

  const handleDeleteClick = (categoryId: string, categoryName: string) => {
    setDeleteDialog({ open: true, categoryId, categoryName })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.categoryId) return

    setDeleteLoading(deleteDialog.categoryId)
    const result = await deleteCategory(deleteDialog.categoryId)
    setDeleteLoading(null)
    setDeleteDialog({ open: false, categoryId: null, categoryName: '' })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.message || 'Kategori berhasil dihapus')
    }
  }

  // Filter and search logic
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          category.name.toLowerCase().includes(searchLower) ||
          (category.description && category.description.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }
      return true
    })
  }, [categories, searchQuery])

  // Pagination (clamped in case the saved page no longer exists)
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const currentPage = Math.min(Math.max(filters.page, 1), Math.max(totalPages, 1))
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Cari nama atau deskripsi kategori..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-auto leading-none text-sm sm:max-w-xs"
        />
        <div className="text-sm text-gray-600 flex items-center ml-auto">
          {filteredCategories.length} kategori
        </div>
      </div>

      {paginatedCategories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🗂️</div>
          <p>Tidak ada kategori ditemukan</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCategories.map((category) => {
                  let IconComp = null;
                  if (category.icon && getCategoryIcon(category.icon)) {
                    IconComp = getCategoryIcon(category.icon)
                  }

                  return (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary-50 flex items-center justify-center text-primary-600">
                            {IconComp ? <IconComp className="h-5 w-5" /> : (category.icon ? <span className="text-lg">{category.icon}</span> : <LinkIcon className="h-5 w-5" />)}
                          </div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category.description || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {onEdit ? (
                            <button 
                              className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                              title="Edit Kategori"
                              onClick={() => {
                                // Close delete modal if open
                                setDeleteDialog({ open: false, categoryId: null, categoryName: '' })
                                onEdit(category)
                              }}
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          ) : (
                            <Link href={`/admin/categories/edit/${category.id}`}>
                              <button 
                                className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                                title="Edit Kategori"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteClick(category.id, category.name)}
                            disabled={deleteLoading === category.id}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                            title="Hapus Kategori"
                          >
                            {deleteLoading === category.id ? (
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
                totalItems={filteredCategories.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, categoryId: null, categoryName: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori "{deleteDialog.categoryName}"? 
              Kategori tidak dapat dihapus jika masih ada barang yang terhubung.
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
