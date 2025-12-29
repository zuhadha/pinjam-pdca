'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { deleteItem } from '@/lib/actions/item-management-actions'
import { Edit, Trash2, Loader2 } from 'lucide-react'
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

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">📦</div>
        <p>Tidak ada barang ditemukan</p>
      </div>
    )
  }

  return (
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
              Stok
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => {
            const stockPercentage = item.stock_total > 0 
              ? (item.stock_available / item.stock_total) * 100 
              : 0
            const isLowStock = stockPercentage < 20 && item.stock_total > 0

            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-2xl">
                        {item.category?.icon || '📦'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {item.description}
                        </p>
                      )}
                      {item.location && (
                        <p className="text-xs text-gray-500">📍 {item.location}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="default" className="min-w-[120px] justify-center">
                    {/* <span>{item.category?.icon}</span> */}
                    <span>{item.category?.name || '-'}</span>
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.stock_available} / {item.stock_total}
                    </p>
                    {isLowStock && (
                      <p className="text-xs text-red-600 font-medium">⚠️ Stok Menipis</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {item.is_sensitive && (
                      <Badge variant="secondary" className="min-w-[50px] justify-center">
                        Sensitif
                      </Badge>
                    )}
                    {!item.is_active && (
                      <Badge variant="destructive" className="min-w-[50px] justify-center">
                        Tidak Aktif
                      </Badge>
                    )}
                    {item.stock_available === 0 && item.is_active && (
                      <Badge variant="gray" className="min-w-[50px] justify-center">
                        Habis
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Link href={`/admin/items/edit/${item.id}`}>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleDeleteClick(item.id, item.name)}
                      disabled={deleteLoading === item.id}
                      size="sm"
                      variant='ghost'
                      className="text-red-500"
                    >
                      {deleteLoading === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !deleteLoading && setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Barang</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus "{deleteDialog.itemName}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
