'use client'

import { createBorrowRequest } from '@/lib/actions/borrow-actions'
import { useCart } from '@/components/cart/cart-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, MapPin, User, Mail, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export function CartCheckoutForm() {
  const { items, clearCart } = useCart()
  const router = useRouter()

  // Borrower identity
  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerEmail, setBorrowerEmail] = useState('')
  const [borrowerDivision, setBorrowerDivision] = useState('')

  // Schedule
  const [borrowingType, setBorrowingType] = useState<'same-day' | 'multi-day'>('same-day')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Details
  const [usageLocation, setUsageLocation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Build datetime strings
      let startDatetime: string | undefined
      let endDatetime: string | undefined

      if (borrowingType === 'same-day') {
        if (!date || !startTime || !endTime) {
          setError('Tanggal dan waktu harus diisi')
          setLoading(false)
          return
        }
        startDatetime = `${date}T${startTime}:00`
        endDatetime = `${date}T${endTime}:00`
      } else {
        if (!startDate || !endDate) {
          setError('Tanggal mulai dan selesai harus diisi')
          setLoading(false)
          return
        }
        startDatetime = `${startDate}T08:00:00`
        endDatetime = `${endDate}T17:00:00`
      }

      const borrowItemsPayload = items.map((item) => ({
        itemId: item.id,
        quantity: item.quantity,
        selectedUnits: item.selectedUnits || []
      }))

      const result = await createBorrowRequest({
        items: borrowItemsPayload,
        borrowerName,
        borrowerEmail,
        borrowerDivision,
        startDatetime,
        endDatetime,
        usageLocation,
        purpose,
        notes,
        isPermanent: false,
      })

      setLoading(false)

      if (result.error) {
        setError(result.error)
      } else {
        clearCart()
        // Redirect to success page with borrower info
        const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)
        const params = new URLSearchParams({
          name: result.borrowerName || '',
          email: result.borrowerEmail || '',
          items: String(result.itemCount || 0),
          qty: String(totalQty),
          type: 'borrow',
        })
        router.push(`/borrow-success?${params.toString()}`)
      }
    } catch (err) {
      setLoading(false)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Detail Peminjaman</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Identitas Peminjam */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            Identitas Peminjam
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="borrower-name">Nama Lengkap *</Label>
              <Input
                id="borrower-name"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                required
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="borrower-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="borrower-email"
                type="email"
                value={borrowerEmail}
                onChange={(e) => setBorrowerEmail(e.target.value)}
                placeholder="email@perusahaan.com"
                required
              />
              <p className="text-xs text-gray-500">
                Konfirmasi peminjaman dan link pengembalian akan dikirim ke email ini.
              </p>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="borrower-division" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Divisi / Departemen *
              </Label>
              <Input
                id="borrower-division"
                value={borrowerDivision}
                onChange={(e) => setBorrowerDivision(e.target.value)}
                placeholder="Contoh: Production, Quality, Maintenance"
                required
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Jadwal Peminjaman
          </h3>

          {/* Borrowing Type */}
          <div className="flex flex-col gap-y-2 mb-4">
            <Label>Jenis Peminjaman</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBorrowingType('same-day')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  borrowingType === 'same-day'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Clock className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Dalam 1 Hari</div>
                <div className="text-xs text-gray-500 mt-1">Pinjam & kembali hari ini</div>
              </button>
              <button
                type="button"
                onClick={() => setBorrowingType('multi-day')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  borrowingType === 'multi-day'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Lebih dari 1 Hari</div>
                <div className="text-xs text-gray-500 mt-1">Pinjam beberapa hari</div>
              </button>
            </div>
          </div>

          {/* Date/Time Fields */}
          {borrowingType === 'same-day' ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="date">Tanggal Peminjaman *</Label>
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
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="start-time">Waktu Mulai *</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="end-time">Waktu Selesai *</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="start-date">Tanggal Mulai *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="end-date">Tanggal Selesai *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Informasi Penggunaan
          </h3>
          <div className="space-y-4">
            {/* Usage Location */}
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasi Penggunaan *
              </Label>
              <Input
                id="location"
                list="checkout-location-options"
                value={usageLocation}
                onChange={(e) => setUsageLocation(e.target.value)}
                placeholder="Pilih atau ketik lokasi penggunaan"
                required
              />
              <datalist id="checkout-location-options">
                <option value="R. Aula Chocolatos" />
                <option value="R. Clevo" />
                <option value="R. Gerry" />
                <option value="R. Training Garuda" />
                <option value="DMS Room" />
              </datalist>
            </div>

            {/* Purpose */}
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="purpose">Tujuan Peminjaman *</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Contoh: Rapat tim bulanan"
                required
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan (opsional)"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Memproses...' : `Ajukan Peminjaman ${items.length} Barang`}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Email konfirmasi beserta link pengembalian akan dikirim ke email Anda setelah peminjaman
          berhasil.
        </p>
      </form>
    </div>
  )
}
