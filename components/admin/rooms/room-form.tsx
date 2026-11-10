'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { saveRoom, type AdminRoom, type RoomInput } from '@/lib/actions/room-admin-actions'
import { RoomImageManager } from './room-image-manager'

interface RoomFormProps {
  mode: 'create' | 'edit'
  initialData?: AdminRoom
  /** order for a new room, after the existing ones */
  nextSortOrder?: number
}

/** Room create/edit form, laid out like the Kelola Barang item form. */
export function RoomForm({ mode, initialData, nextSortOrder = 0 }: RoomFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<RoomInput>({
    id: initialData?.id,
    name: initialData?.name ?? '',
    area: initialData?.area ?? '',
    max_people: initialData?.max_people ?? null,
    facilities: initialData?.facilities ?? '',
    status: initialData?.status ?? 'available',
    sort_order: initialData?.sort_order ?? nextSortOrder,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.name.trim()) {
      setError('Nama ruangan harus diisi')
      return
    }
    setLoading(true)
    const result = await saveRoom(formData)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (mode === 'create') {
      toast.success('Ruangan ditambahkan. Sekarang tambahkan fotonya.')
      router.push(`/admin/rooms/edit/${result.id}`)
    } else {
      toast.success('Ruangan berhasil disimpan')
      router.push('/admin/rooms')
    }
  }

  const statusOption = (value: RoomInput['status'], title: string, description: string) => (
    <label
      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
      style={{ borderColor: formData.status === value ? '#0066cc' : '#d1d5db' }}
    >
      <input
        type="radio"
        name="room_status"
        checked={formData.status === value}
        onChange={() => setFormData({ ...formData, status: value })}
        className="h-4 w-4 text-primary-600"
      />
      <div>
        <span className="font-medium text-gray-900">{title}</span>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </label>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Informasi Ruangan Baru' : 'Edit Informasi Ruangan'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Nama Ruangan *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: R.Aula Chocolatos"
              required
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="area">Lokasi</Label>
              <Input
                id="area"
                value={formData.area ?? ''}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="Contoh: Office Lt.2"
              />
            </div>
            <div>
              <Label htmlFor="max_people">Kapasitas (orang)</Label>
              <Input
                id="max_people"
                type="number"
                min={1}
                value={formData.max_people ?? ''}
                onChange={(e) => setFormData({ ...formData, max_people: e.target.value ? parseInt(e.target.value, 10) : null })}
                placeholder="Contoh: 30"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="facilities">Fasilitas</Label>
            <textarea
              id="facilities"
              value={formData.facilities ?? ''}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
              placeholder={'Satu fasilitas per baris, contoh:\nProyektor\nAC\nWhiteboard'}
              className="min-h-[100px] w-full rounded-md border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <Label>Status Ruangan *</Label>
            <div className="mt-2 space-y-2">
              {statusOption('available', 'Bisa Dibooking', 'Ruangan tampil di halaman booking dan bisa dipesan')}
              {statusOption('maintenance', 'Dalam Perbaikan', 'Ruangan tetap tampil, tapi tidak bisa dibooking sementara')}
            </div>
          </div>

          <div className="sm:max-w-xs">
            <Label htmlFor="sort_order">Urutan Tampil</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order ?? 0}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
            />
            <p className="mt-1 text-xs text-gray-500">Angka kecil tampil lebih dulu di kalender dan daftar ruangan.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Foto Ruangan</label>
            {mode === 'edit' && initialData ? (
              <RoomImageManager roomId={initialData.id} images={initialData.images} />
            ) : (
              <p className="rounded-md border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                Foto bisa ditambahkan setelah ruangan disimpan.
              </p>
            )}
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/rooms')} className="flex-1" disabled={loading}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Ruangan' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
