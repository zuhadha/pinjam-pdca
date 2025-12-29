'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createItem, updateItem } from '@/lib/actions/item-management-actions'
import { ImageUpload } from '@/components/admin/image-upload'
import { getItemImages } from '@/lib/actions/image-actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface ItemFormProps {
  categories: any[]
  mode: 'create' | 'edit'
  initialData?: any
}

export function ItemForm({ categories, mode, initialData }: ItemFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState<any[]>(initialData?.images || [])
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || '',
    stock_total: initialData?.stock_total || 0,
    location: initialData?.location || '',
    is_sensitive: initialData?.is_sensitive || false,
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.name.trim()) {
      setError('Nama barang harus diisi')
      setLoading(false)
      return
    }

    if (!formData.category_id) {
      setError('Kategori harus dipilih')
      setLoading(false)
      return
    }

    if (formData.stock_total < 0) {
      setError('Stok total tidak boleh negatif')
      setLoading(false)
      return
    }

    const result = mode === 'create'
      ? await createItem(formData)
      : await updateItem(initialData.id, formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      toast.success(result.message || 'Barang berhasil disimpan')
      router.push('/admin/items')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Informasi Barang Baru' : 'Edit Informasi Barang'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name">Nama Barang *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Laptop Dell Latitude 5420"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi detail barang..."
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent min-h-[100px]"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Kategori *</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stock */}
          <div>
            <Label htmlFor="stock_total">Stok Total *</Label>
            <Input
              id="stock_total"
              type="number"
              min="0"
              value={formData.stock_total}
              onChange={(e) => setFormData({ ...formData, stock_total: parseInt(e.target.value) || 0 })}
              required
            />
            {mode === 'edit' && initialData && (
              <p className="text-sm text-gray-600 mt-1">
                Stok tersedia saat ini: {initialData.stock_available}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Lokasi</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Contoh: Ruang IT - Rak A1"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto Barang
            </label>
            <ImageUpload
              itemId={initialData?.id}
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_sensitive"
                checked={formData.is_sensitive}
                onChange={(e) => setFormData({ ...formData, is_sensitive: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
              />
              <Label htmlFor="is_sensitive" className="cursor-pointer">
                🔒 Barang Sensitif (Perlu persetujuan admin)
              </Label>
            </div>

            {mode === 'edit' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  ✓ Aktif (Tampilkan di katalog)
                </Label>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
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
              {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Barang' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
