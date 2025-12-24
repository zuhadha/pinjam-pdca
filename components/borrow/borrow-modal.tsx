'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBorrowRequest, type BorrowRequestItem } from '@/lib/actions/borrow-actions'
import { toast } from 'sonner'

interface BorrowModalProps {
  initialItems?: Array<{ id: string; name: string; stock_available: number }>
  onClose: () => void
}

export function BorrowModal({ initialItems = [], onClose }: BorrowModalProps) {
  const router = useRouter()
  const [items, setItems] = useState<BorrowRequestItem[]>(
    initialItems.map(item => ({ itemId: item.id, quantity: 1 }))
  )
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!startDate || !endDate) {
      setError('Tanggal mulai dan tanggal selesai harus diisi')
      setLoading(false)
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Tanggal selesai harus setelah tanggal mulai')
      setLoading(false)
      return
    }

    if (!purpose.trim()) {
      setError('Keperluan harus diisi')
      setLoading(false)
      return
    }

    if (items.length === 0) {
      setError('Minimal pilih 1 barang')
      setLoading(false)
      return
    }

    const result = await createBorrowRequest({
      items,
      startDate,
      endDate,
      purpose,
      notes,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      toast.success(result.message)
      onClose()
      router.push('/dashboard')
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = initialItems.find(i => i.id === itemId)
    if (!item) return

    if (quantity < 1) quantity = 1
    if (quantity > item.stock_available) quantity = item.stock_available

    setItems(prev =>
      prev.map(i => (i.itemId === itemId ? { ...i, quantity } : i))
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Form Peminjaman</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Barang yang Dipinjam</h3>
              <div className="space-y-3">
                {initialItems.map((item) => {
                  const selectedItem = items.find(i => i.itemId === item.id)
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Stok tersedia: {item.stock_available}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (selectedItem?.quantity || 1) - 1)}
                          className="w-8 h-8 rounded-md bg-white border border-gray-300 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-medium">
                          {selectedItem?.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (selectedItem?.quantity || 1) + 1)}
                          className="w-8 h-8 rounded-md bg-white border border-gray-300 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Tanggal Mulai *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">Tanggal Selesai *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <Label htmlFor="purpose">Keperluan *</Label>
              <Input
                id="purpose"
                type="text"
                placeholder="Contoh: Presentasi ke klien, Rapat tim, dll"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <textarea
                id="notes"
                placeholder="Tambahkan catatan jika diperlukan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
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
                {loading ? 'Memproses...' : 'Ajukan Peminjaman'}
              </Button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">ℹ️ Informasi:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Barang regular akan otomatis disetujui</li>
                <li>Barang sensitif memerlukan persetujuan admin</li>
                <li>Pastikan mengembalikan barang tepat waktu</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
