'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCategory, updateCategory } from '@/lib/actions/item-management-actions'
import { IconPicker } from '@/components/admin/icon-picker'
import { toast } from 'sonner'

interface CategoryFormProps {
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function CategoryForm({ mode, initialData, onSuccess, onCancel }: CategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    icon: initialData?.icon || 'Box', // default fallback icon if none
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.name.trim()) {
      setError('Nama kategori harus diisi')
      setLoading(false)
      return
    }

    if (!formData.icon) {
      setError('Ikon kategori harus dipilih')
      setLoading(false)
      return
    }

    const result = mode === 'create'
      ? await createCategory(formData)
      : await updateCategory(initialData.id, formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      toast.success(result.message || 'Kategori berhasil disimpan')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/admin/categories')
      }
    }
  }

  return (
    <div className="w-full">
      {!onSuccess && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{mode === 'create' ? 'Tambah Kategori Baru' : 'Edit Kategori'}</h2>
        </div>
      )}
      <div className="bg-white rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name">Nama Kategori *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Elektronik, Kendaraan, Alat Tulis"
              required
            />
          </div>

          {/* Icon */}
          <IconPicker 
            value={formData.icon} 
            onChange={(val) => setFormData({ ...formData, icon: val })} 
          />

          {/* Description */}
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat jenis barang pada kategori ini..."
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent min-h-[100px]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onCancel ? onCancel() : router.back()}
              className="flex-1"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Kategori' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
