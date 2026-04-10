'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBorrowRequest, type BorrowRequestItem } from '@/lib/actions/borrow-actions'
import { toast } from 'sonner'

interface BorrowModalProps {
  initialItems?: Array<{ id: string; name: string; stock_available: number; is_borrowable: boolean }>
  onClose: () => void
}

export function BorrowModal({ initialItems = [], onClose }: BorrowModalProps) {
  const router = useRouter()
  const [items, setItems] = useState<BorrowRequestItem[]>(
    initialItems.map(item => ({ itemId: item.id, quantity: 1 }))
  )
  
  // Auto-detect request type from items
  const isBorrowable = initialItems.length > 0 ? initialItems[0].is_borrowable : true
  const isPermanent = !isBorrowable
  
  // Borrowing type state (only for borrowing)
  const [borrowingType, setBorrowingType] = useState<'same-day' | 'multi-day'>('same-day')
  
  // Same-day fields
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  
  // Multi-day fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Common fields
  const [usageLocation, setUsageLocation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  
  // Borrower identity
  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerEmail, setBorrowerEmail] = useState('')
  const [borrowerDivision, setBorrowerDivision] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate borrower identity
    if (!borrowerName.trim()) {
      setError('Nama peminjam harus diisi')
      setLoading(false)
      return
    }
    if (!borrowerEmail.trim()) {
      setError('Email peminjam harus diisi')
      setLoading(false)
      return
    }
    if (!borrowerDivision.trim()) {
      setError('Divisi/Departemen harus diisi')
      setLoading(false)
      return
    }

    // Validate usage location
    if (!usageLocation.trim()) {
      setError('Lokasi penggunaan harus diisi')
      setLoading(false)
      return
    }

    // Validate based on item type
    let startDatetime: string | undefined
    let endDatetime: string | undefined

    if (isBorrowable) {
      // Borrowing requires dates
      if (borrowingType === 'same-day') {
        if (!date || !startTime || !endTime) {
          setError('Tanggal dan waktu harus diisi lengkap')
          setLoading(false)
          return
        }
        startDatetime = `${date}T${startTime}:00`
        endDatetime = `${date}T${endTime}:00`
      } else {
        if (!startDate || !endDate) {
          setError('Tanggal mulai dan tanggal selesai harus diisi')
          setLoading(false)
          return
        }
        startDatetime = `${startDate}T00:00:00`
        endDatetime = `${endDate}T23:59:59`
      }
    }
    // Permanent requests don't need dates

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
      borrowerName,
      borrowerEmail,
      borrowerDivision,
      isPermanent,
      startDatetime,
      endDatetime,
      usageLocation,
      purpose,
      notes,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      toast.success(result.message)
      onClose()
      const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)
      const params = new URLSearchParams({
        name: result.borrowerName || '',
        email: result.borrowerEmail || '',
        items: String(result.itemCount || items.length),
        qty: String(totalQty),
        type: isPermanent ? 'request' : 'borrow',
      })
      router.push(`/borrow-success?${params.toString()}`)
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
            <h2 className="text-2xl font-bold text-gray-900">
              {isBorrowable ? 'Form Peminjaman' : 'Form Permintaan Barang'}
            </h2>
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
              <h3 className="font-semibold text-gray-900 mb-3">
                {isBorrowable ? 'Barang yang Dipinjam' : 'Barang yang Diminta'}
              </h3>
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

            {/* Borrower Identity */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Identitas Peminjam</h3>
              
              <div>
                <Label htmlFor="modal-borrower-name">Nama Lengkap *</Label>
                <Input
                  id="modal-borrower-name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="modal-borrower-email">Email *</Label>
                <Input
                  id="modal-borrower-email"
                  type="email"
                  placeholder="email@perusahaan.com"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="modal-borrower-division">Divisi / Departemen *</Label>
                <Input
                  id="modal-borrower-division"
                  type="text"
                  placeholder="Contoh: Production, Quality"
                  value={borrowerDivision}
                  onChange={(e) => setBorrowerDivision(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Borrowing Type Switch (only for borrowing) */}
            {isBorrowable && (
              <div>
                <Label>Tipe Peminjaman *</Label>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setBorrowingType('same-day')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      borrowingType === 'same-day'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    ⏰ Dalam Satu Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowingType('multi-day')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      borrowingType === 'multi-day'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    📅 Lebih dari Satu Hari
                  </button>
                </div>
              </div>
            )}

            {/* Conditional Date/Time Inputs (only for borrowing) */}
            {isBorrowable && (
              borrowingType === 'same-day' ? (
              <>
                <div>
                  <Label htmlFor="date">Tanggal *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Waktu Mulai *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Waktu Selesai *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
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
            )
            )}

            {/* Usage Location */}
            <div>
              <Label htmlFor="usageLocation">Lokasi Penggunaan *</Label>
              <Input
                id="usageLocation"
                type="text"
                placeholder="Contoh: Ruang Rapat A, Gedung C - Lantai 3"
                value={usageLocation}
                onChange={(e) => setUsageLocation(e.target.value)}
                required
              />
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="text-sm">{error}</p>
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
                {loading ? 'Memproses...' : isBorrowable ? 'Pinjam' : 'Ambil'}
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
