'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CategoriesTable } from '@/components/admin/categories-table'
import { CategoryForm } from '@/components/admin/category-form'
import { X } from 'lucide-react'

export function CategoriesManager({ initialCategories }: { initialCategories: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  
  const handleSuccess = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    // Server action already called revalidatePath, so data will refresh automatically
    // or router.refresh() if needed, but Next handles it mostly.
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const openEditModal = (category: any) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Kategori</h1>
          <p className="text-gray-600 mt-2">Kelola kategori barang yang tersedia dalam sistem</p>
        </div>
        <Button 
          variant="primary" 
          className="flex items-center gap-2"
          onClick={openCreateModal}
        >
          <Plus className="h-5 w-5" />
          Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>
            Kelola semua Master Data kategori dengan memfilter dan menambahkannya
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesTable categories={initialCategories} onEdit={openEditModal} />
        </CardContent>
      </Card>

      {/* Tailwind Modal for Creation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingCategory(null)
                }}
                className="text-gray-500 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <CategoryForm 
                mode={editingCategory ? 'edit' : 'create'}
                initialData={editingCategory}
                onSuccess={handleSuccess} 
                onCancel={() => {
                  setIsModalOpen(false)
                  setEditingCategory(null)
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
