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
import * as LucideIcons from 'lucide-react'
import { PlusCircle, MinusCircle } from 'lucide-react'
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
    location: initialData?.location || '',
    is_borrowable: initialData?.is_borrowable ?? true,
    units: initialData?.units || [],
    stock_quantity: initialData?.stock_total || 0, // Only used when is_borrowable = false
  })

  // Unit array handlers
  const addUnit = () => {
    setFormData({ ...formData, units: [...formData.units, { code: '' }] })
  }

  const removeUnit = (index: number) => {
    setFormData({ ...formData, units: formData.units.filter((_: any, i: number) => i !== index) })
  }

  const handleUnitChange = (index: number, code: string) => {
    const newUnits = [...formData.units]
    newUnits[index].code = code
    setFormData({ ...formData, units: newUnits })
  }

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

    // Only validate units for borrowable items
    if (formData.is_borrowable) {
      if (formData.units.some((u: any) => !u.code.trim())) {
        setError('Kode unit tidak boleh kosong')
        setLoading(false)
        return
      }

      const codes = formData.units.map((u: any) => u.code.trim().toLowerCase())
      if (new Set(codes).size !== codes.length) {
        setError('Ada duplikasi kode pada tabel ini. Pastikan semua kode unik.')
        setLoading(false)
        return
      }
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
                {categories.map((cat) => {
                  const IconComp = cat.icon && (LucideIcons as any)[cat.icon]
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        {IconComp ? <IconComp className="h-4 w-4" /> : <span>{cat.icon}</span>}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Stock Section — conditional on item type */}
          {formData.is_borrowable ? (
            // Borrowable: Unit Code manager
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Kode Unit Barang *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addUnit} className="h-8 gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Tambah Unit
                </Button>
              </div>
              
              {formData.units.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center py-4 bg-white border border-gray-200 rounded-md">
                  Belum ada unit. Tambahkan unit agar barang dapat dipinjam.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.units.map((unit: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={unit.code}
                        onChange={(e) => handleUnitChange(index, e.target.value)}
                        placeholder={`Kode unit unik (contoh: ${formData.name.split(' ')[0].toLowerCase().substring(0,3)}${String(index+1).padStart(3, '0')})`}
                        required
                        className="bg-white"
                      />
                      {unit.is_available === false && unit.id && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded whitespace-nowrap">
                          Sedang Dipinjam
                        </span>
                      )}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => removeUnit(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                        title="Hapus unit ini"
                      >
                        <MinusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {mode === 'edit' && initialData && (
                <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                  Stok tersedia (tidak dipinjam) saat ini: {initialData.stock_available} / {formData.units.length}
                </p>
              )}
            </div>
          ) : (
            // Non-borrowable: Simple quantity input
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <Label className="text-base mb-3 block">Jumlah Stok *</Label>
              <p className="text-sm text-gray-500 mb-3">
                Barang permintaan menggunakan stok angka — tidak memerlukan kode unit per barang.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  className="bg-white w-32"
                />
                <span className="text-sm text-gray-500">unit tersedia</span>
              </div>
            </div>
          )}

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

          {/* Item Type */}
          <div>
            <Label>Tipe Barang *</Label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: formData.is_borrowable ? '#0066cc' : '#d1d5db' }}>
                <input
                  type="radio"
                  name="item_type"
                  checked={formData.is_borrowable === true}
                  onChange={() => setFormData({ ...formData, is_borrowable: true })}
                  className="h-4 w-4 text-primary-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Barang Pinjaman</span>
                  <p className="text-sm text-gray-600">Barang dipinjam sementara dan harus dikembalikan</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: formData.is_borrowable === false ? '#0066cc' : '#d1d5db' }}>
                <input
                  type="radio"
                  name="item_type"
                  checked={formData.is_borrowable === false}
                  onChange={() => setFormData({ ...formData, is_borrowable: false })}
                  className="h-4 w-4 text-primary-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Barang Permintaan</span>
                  <p className="text-sm text-gray-600">Barang diminta untuk dipakai permanent (tidak perlu dikembalikan)</p>
                </div>
              </label>
            </div>
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
