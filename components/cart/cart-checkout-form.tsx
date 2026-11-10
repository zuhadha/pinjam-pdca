'use client'

import { createBorrowRequest } from '@/lib/actions/borrow-actions'
import { useCart } from '@/components/cart/cart-context'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, MapPin, User, Mail, Building2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useIsAdmin } from '@/lib/hooks/use-is-admin'
import { todayLocalDate } from '@/lib/utils/date-utils'
import { RoomAgendaPicker } from '@/components/rooms/room-agenda-picker'
import type { RoomAgendaOption } from '@/lib/actions/room-actions'

const TIME_OPTIONS = Array.from({ length: 19 }, (_, i) => {
  const h = Math.floor(i / 2 + 8)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

const DIVISIONS = [
  'QA',
  'QC',
  'SHE',
  'PDCA',
  'PPIC',
  'HCS',
  'Teknik',
  'Produksi',
  'MPDD',
  'EPrD',
  'Finance',
  'Formula',
  'Warehouse',
  'Project',
  'IT',
]

const LOCATIONS = [
  'R. Aula Chocolatos',
  'R. Clevo',
  'R. Gerry',
  'R. Training Garuda',
  'DMS Room',
  'Chocolatos Cafe',
]

function LocationCombobox({ value, onChange, required }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setInputValue(value) }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = LOCATIONS.filter(l =>
    l.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleSelect = (loc: string) => {
    setInputValue(loc)
    onChange(loc)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label htmlFor="usageLocation" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Lokasi Penggunaan {required && '*'}
      </Label>
      <div ref={containerRef} className="relative">
        <div
          className={`flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-primary-600 focus-within:border-transparent transition-shadow ${
            open ? 'ring-2 ring-primary-600 border-transparent' : 'border-gray-300'
          }`}
        >
          <input
            id="usageLocation"
            type="text"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
            placeholder="Pilih atau ketik lokasi penggunaan"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            required={required}
            autoComplete="off"
          />
          <ChevronDown
            className={`h-4 w-4 opacity-50 transition-transform cursor-pointer flex-shrink-0 ${open ? 'rotate-180' : ''}`}
            onClick={() => setOpen(v => !v)}
          />
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md overflow-y-auto max-h-[136px]">
            <div className="p-1">
              {filtered.length > 0 ? (
                filtered.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(loc) }}
                    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-3 pr-8 text-sm outline-none transition-colors hover:bg-primary-100 hover:text-primary-900 ${
                      value === loc ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {loc}
                    {value === loc && (
                      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                        <svg viewBox="0 0 12 12" fill="none" className="h-4 w-4">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))
              ) : inputValue ? (
                <div className="py-1.5 pl-3 text-sm text-gray-500 italic">Gunakan "{inputValue}" sebagai lokasi</div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CartCheckoutForm() {
  const { items, clearCart } = useCart()
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const today = todayLocalDate()
  // Admins can record past borrowings, so no lower date limit for them
  const minDate = isAdmin ? undefined : today

  const isBorrowable = items.length > 0 ? items[0].is_borrowable : true
  const isPermanent = !isBorrowable

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

  // Admin only
  const [autoReturned, setAutoReturned] = useState(false)
  const [requestDate, setRequestDate] = useState(today)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Copy a room booking's borrower, schedule, room and agenda into the form
  const applyRoomAgenda = (a: RoomAgendaOption) => {
    setBorrowerName(a.borrower_name)
    if (a.email) setBorrowerEmail(a.email)
    // Use the list's own spelling when it matches; otherwise keep the booking's department
    setBorrowerDivision(DIVISIONS.find((d) => d.toLowerCase() === a.department.trim().toLowerCase()) ?? a.department.trim())
    setBorrowingType('same-day')
    setDate(a.booking_date)
    setStartTime(a.start_time)
    setEndTime(a.end_time)
    setUsageLocation(a.room_name)
    setPurpose(a.agenda)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Build datetime strings
      let startDatetime: string | undefined
      let endDatetime: string | undefined

      if (isBorrowable) {
        if (borrowingType === 'same-day') {
          if (!date || !startTime || !endTime) {
            setError('Tanggal dan waktu harus diisi')
            setLoading(false)
            return
          }
          startDatetime = `${date}T${startTime}:00+07:00`
          endDatetime = `${date}T${endTime}:00+07:00`
        } else {
          if (!startDate || !endDate) {
            setError('Tanggal mulai dan selesai harus diisi')
            setLoading(false)
            return
          }
          startDatetime = `${startDate}T08:00:00+07:00`
          endDatetime = `${endDate}T17:00:00+07:00`
        }

        if (!usageLocation.trim()) {
          setError('Lokasi penggunaan harus diisi')
          setLoading(false)
          return
        }
      }

      // Items with unit codes need one code per unit
      for (const item of items) {
        const hasUnits = item.is_borrowable && (item.availableUnits?.length || 0) > 0
        if (hasUnits && (item.selectedUnits?.length || 0) !== item.quantity) {
          setError(`Pilih ${item.quantity} kode unit untuk ${item.name}`)
          setLoading(false)
          return
        }
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
        usageLocation: isPermanent ? '-' : usageLocation,
        purpose,
        notes,
        isPermanent,
        requestDate: isAdmin && isPermanent ? requestDate : undefined,
        autoReturned: isAdmin && isBorrowable ? autoReturned : undefined,
      })

      setLoading(false)

      if (result.error) {
        setError(result.error)
      } else {
        clearCart()
        if (isAdmin && isBorrowable && autoReturned) {
          toast.success(result.message)
          router.push('/admin/requests')
          return
        }
        // Redirect to success page with borrower info
        const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)
        const params = new URLSearchParams({
          name: result.borrowerName || '',
          email: result.borrowerEmail || '',
          items: String(result.itemCount || 0),
          qty: String(totalQty),
          type: isPermanent ? 'request' : 'borrow',
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
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {isBorrowable ? 'Detail Peminjaman' : 'Detail Permintaan'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fill borrower, schedule, location and purpose from a room booking */}
        {isBorrowable && <RoomAgendaPicker onPick={applyRoomAgenda} />}

        {/* Section: Identitas Peminjam */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            {isBorrowable ? 'Identitas Peminjam' : 'Identitas Penerima'}
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
                {isBorrowable 
                  ? 'Konfirmasi peminjaman dan link pengembalian akan dikirim ke email ini.'
                  : 'Konfirmasi permintaan akan dikirim ke email ini.'}
              </p>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="borrower-division" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Divisi / Departemen *
              </Label>
              <Select
                value={borrowerDivision}
                onValueChange={setBorrowerDivision}
                required
              >
                <SelectTrigger id="borrower-division">
                  <SelectValue placeholder="Pilih divisi / departemen" />
                </SelectTrigger>
                <SelectContent className="max-h-[160px]">
                  {(borrowerDivision && !DIVISIONS.includes(borrowerDivision) ? [...DIVISIONS, borrowerDivision] : DIVISIONS).map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isBorrowable && (
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
                    min={minDate}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="start-time">Waktu Mulai *</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger id="start-time">
                        <SelectValue placeholder="Pilih waktu mulai" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="end-time">Waktu Selesai *</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger id="end-time">
                        <SelectValue placeholder="Pilih waktu selesai" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    min={minDate}
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
                    min={startDate || minDate}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {isBorrowable && (
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Informasi Penggunaan
            </h3>
            <div className="space-y-4">
              {/* Usage Location */}
              <LocationCombobox
                value={usageLocation}
                onChange={setUsageLocation}
                required={isBorrowable}
              />

              {/* Purpose */}
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="purpose">Tujuan Peminjaman *</Label>
                <Input
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Contoh: Rapat tim bulanan"
                  required={isBorrowable}
                />
              </div>
            </div>
          </div>
        )}

        {/* Admin: backdate a request */}
        {isAdmin && isPermanent && (
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="request-date">Tanggal Permintaan (Admin)</Label>
            <Input
              id="request-date"
              type="date"
              value={requestDate}
              max={today}
              onChange={(e) => setRequestDate(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">Ubah jika mencatat permintaan yang sudah terjadi.</p>
          </div>
        )}

        {/* Admin: log a borrowing that is already finished */}
        {isAdmin && isBorrowable && (
          <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={autoReturned}
              onChange={(e) => setAutoReturned(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">Sudah dikembalikan</span>
              <span className="block text-xs text-gray-500">
                Barang sudah dipinjam dan sudah kembali. Dicatat sebagai riwayat, stok tidak berubah, dan email tidak dikirim.
              </span>
            </span>
          </label>
        )}

        {/* Notes (Always shown) */}
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
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Memproses...' : `Ajukan ${isBorrowable ? 'Peminjaman' : 'Permintaan'} ${items.length} Barang`}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Email konfirmasi {isBorrowable ? 'beserta link pengembalian ' : ''}akan dikirim ke email Anda setelah {isBorrowable ? 'peminjaman' : 'permintaan'} berhasil.
        </p>
      </form>
    </div>
  )
}
