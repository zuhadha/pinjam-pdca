'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown } from 'lucide-react'
import { createBorrowRequest, type BorrowRequestItem } from '@/lib/actions/borrow-actions'
import { toast } from 'sonner'
import { useIsAdmin } from '@/lib/hooks/use-is-admin'
import { toggleUnitInSelection, trimSelection } from '@/lib/utils/unit-selection'
import { todayLocalDate } from '@/lib/utils/date-utils'

interface BorrowModalProps {
  initialItems?: Array<{ 
    id: string; 
    name: string; 
    stock_available: number; 
    is_borrowable: boolean;
    units?: Array<{ id: string; code: string; is_available: boolean }>
  }>
  onClose: () => void
}

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

// Custom combobox for location: styled like Select but allows free text input
function LocationCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value → input
  useEffect(() => { setInputValue(value) }, [value])

  // Close on outside click
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
    <div ref={containerRef} className="relative">
      <Label htmlFor="usageLocation" className="mb-1 block text-gray-700">Lokasi Penggunaan *</Label>
      <div
        className={`flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-primary-600 focus-within:border-transparent transition-shadow ${
          open ? 'ring-2 ring-primary-600 border-transparent' : 'border-gray-300'
        }`}
      >
        <input
          id="usageLocation"
          type="text"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
          placeholder="Pilih atau ketik lokasi"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          required
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
  )
}

export function BorrowModal({ initialItems = [], onClose }: BorrowModalProps) {
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const today = todayLocalDate()
  // Admins can record past borrowings, so no lower date limit for them
  const minDate = isAdmin ? undefined : today
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
  const [usageLocation, setUsageLocation] = useState(isPermanent ? '-' : '')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  
  // Borrower identity
  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerEmail, setBorrowerEmail] = useState('')
  const [borrowerDivision, setBorrowerDivision] = useState('')

  // Admin only
  const [autoReturned, setAutoReturned] = useState(false)
  const [requestDate, setRequestDate] = useState(today)

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

    // Validate usage location (only for borrowing)
    if (isBorrowable && !usageLocation.trim()) {
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
        startDatetime = `${date}T${startTime}:00+07:00`
        endDatetime = `${date}T${endTime}:00+07:00`
      } else {
        if (!startDate || !endDate) {
          setError('Tanggal mulai dan tanggal selesai harus diisi')
          setLoading(false)
          return
        }
        startDatetime = `${startDate}T00:00:00+07:00`
        endDatetime = `${endDate}T23:59:59+07:00`
      }
    }
    // Permanent requests don't need dates

    // if (!purpose.trim()) {
    //   setError('Keperluan harus diisi')
    //   setLoading(false)
    //   return
    // }

    if (items.length === 0) {
      setError('Minimal pilih 1 barang')
      setLoading(false)
      return
    }

    // Items with unit codes need one code per unit
    for (const item of initialItems) {
      const hasUnits = item.is_borrowable && (item.units?.some(u => u.is_available) ?? false)
      if (!hasUnits) continue
      const selected = items.find(i => i.itemId === item.id)
      const qty = selected?.quantity || 1
      if ((selected?.selectedUnits?.length || 0) !== qty) {
        setError(`Pilih ${qty} kode unit untuk ${item.name}`)
        setLoading(false)
        return
      }
    }

    const result = await createBorrowRequest({
      items,
      borrowerName,
      borrowerEmail,
      borrowerDivision,
      isPermanent,
      startDatetime,
      endDatetime,
      usageLocation: isPermanent ? '-' : usageLocation,
      purpose,
      notes,
      requestDate: isAdmin && isPermanent ? requestDate : undefined,
      autoReturned: isAdmin && isBorrowable ? autoReturned : undefined,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      toast.success(result.message)
      onClose()
      if (isAdmin && isBorrowable && autoReturned) {
        // Nothing for the borrower to do; just refresh stock on the current page
        router.refresh()
        return
      }
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

  const getMaxQuantity = (item: (typeof initialItems)[number]) => {
    const availableUnits = item.units?.filter(u => u.is_available) || []
    return item.is_borrowable && availableUnits.length > 0
      ? availableUnits.length
      : item.stock_available
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = initialItems.find(i => i.id === itemId)
    if (!item) return

    const max = getMaxQuantity(item)
    if (quantity > max) quantity = max
    if (quantity < 1) quantity = 1

    setItems(prev =>
      prev.map(i =>
        i.itemId === itemId
          ? { ...i, quantity, selectedUnits: trimSelection(i.selectedUnits, quantity) }
          : i
      )
    )
  }

  const toggleUnit = (itemId: string, unitId: string, unitCode: string) => {
    const current = items.find(i => i.itemId === itemId)
    if (!current) return

    const next = toggleUnitInSelection(
      current.selectedUnits || [],
      { id: unitId, code: unitCode },
      current.quantity
    )
    if (!next) {
      toast.warning(`Sudah memilih ${current.quantity} kode. Tambah jumlah untuk memilih lebih banyak.`)
      return
    }

    setItems(prev => prev.map(i => (i.itemId === itemId ? { ...i, selectedUnits: next } : i)))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-white flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {isBorrowable ? 'Form Peminjaman' : 'Form Permintaan Barang'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
        <div className="p-6 pt-0">

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selected Items */}
            <div>
              {/* <h3 className="font-semibold text-gray-900 mb-3">
                {isBorrowable ? 'Barang yang Dipinjam' : 'Barang yang Diminta'}
              </h3> */}
              <div className="space-y-3">
                {initialItems.map((item) => {
                  const selectedItem = items.find(i => i.itemId === item.id)
                  const availableUnits = item.units?.filter(u => u.is_available) || []
                  const quantity = selectedItem?.quantity || 1
                  const selectedCount = selectedItem?.selectedUnits?.length || 0
                  const maxQuantity = getMaxQuantity(item)

                  return (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 leading-tight">{item.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Stok tersedia: {item.stock_available}</p>
                        </div>
                        
                        {/* Quantity Controls (default 1) */}
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, quantity - 1)}
                            disabled={quantity <= 1}
                            className="w-8 h-8 rounded-md bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <span className="w-10 text-center font-medium">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, quantity + 1)}
                            disabled={quantity >= maxQuantity}
                            className="w-8 h-8 rounded-md bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Unit Variations Grid - Compact Chips Version */}
                      {item.is_borrowable && availableUnits.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Pilih Kode:</span>
                            <span className={`text-[10px] font-semibold ${selectedCount === quantity ? 'text-primary-600' : 'text-amber-600'}`}>
                              {selectedCount}/{quantity} dipilih
                            </span>
                            {/* {!selectedItem?.selectedUnits?.length && (
                              <span className="text-[9px] text-red-500 italic animate-pulse">
                                * Wajib dipilih
                              </span>
                            )} */}
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {availableUnits.map((unit) => {
                              const isSelected = selectedItem?.selectedUnits?.some(u => u.id === unit.id)
                              return (
                                <button
                                  key={unit.id}
                                  type="button"
                                  onClick={() => toggleUnit(item.id, unit.id, unit.code)}
                                  className={`
                                    px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 border
                                    ${isSelected 
                                      ? 'bg-primary-600 border-primary-600 text-white shadow-sm ring-2 ring-primary-100 scale-[1.02]' 
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-gray-50'
                                    }
                                  `}
                                >
                                  {unit.code}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Borrower Identity */}
            <div className="space-y-3">
              {/* <h3 className="font-semibold text-gray-900">Identitas Peminjam</h3> */}

              {/* Name + Email in 1 row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="modal-borrower-name" className="mb-1 block text-gray-700">Nama Lengkap *</Label>
                  <Input
                    className='text-sm'
                    id="modal-borrower-name"
                    type="text"
                    placeholder="Nama lengkap"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="modal-borrower-email" className="mb-1 block text-gray-700">Email *</Label>
                  <Input
                    className='text-sm'
                    id="modal-borrower-email"
                    type="email"
                    placeholder="email@perusahaan.com"
                    value={borrowerEmail}
                    onChange={(e) => setBorrowerEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Division full-width */}
              <div>
                <Label htmlFor="modal-borrower-division" className="mb-1 block text-gray-700">Divisi / Departemen *</Label>
                <Select
                  value={borrowerDivision}
                  onValueChange={setBorrowerDivision}
                  required
                >
                  <SelectTrigger id="modal-borrower-division">
                    <SelectValue placeholder="Pilih divisi / departemen" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[160px]">
                    {DIVISIONS.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                      borrowingType === 'same-day'
                        ? 'bg-primary-600 text-white border-primary-400'
                        : 'bg-white text-gray-400 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    Dalam Satu Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowingType('multi-day')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                      borrowingType === 'multi-day'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    Lebih dari Satu Hari
                  </button>
                </div>
              </div>
            )}

            {/* Conditional Date/Time Inputs (only for borrowing) */}
            {isBorrowable && (
              borrowingType === 'same-day' ? (
              <>
                {/* Tanggal + Waktu Mulai + Waktu Selesai in 1 row (50% / 25% / 25%) */}
                <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                  <div>
                    <Label htmlFor="date" className="mb-1 block text-gray-700">Tanggal *</Label>
                    <Input
                      className='text-sm'
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={minDate}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime" className="mb-1 block text-gray-700">Mulai *</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger id="startTime" className="text-sm">
                        <SelectValue placeholder="Mulai" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="mb-1 block text-gray-700">Selesai *</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger id="endTime" className="text-sm">
                        <SelectValue placeholder="Selesai" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate" className="mb-1 block text-gray-700">Tanggal Mulai *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={minDate}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="mb-1 block text-gray-700">Tanggal Selesai *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || minDate}
                    required
                  />
                </div>
              </div>
            )
            )}

            {/* Usage Location - Custom Combobox (Only for Borrowing) */}
            {isBorrowable && (
              <div className="grid gap-3 text-sm" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <LocationCombobox
                  value={usageLocation}
                  onChange={setUsageLocation}
                />
                <div>
                  <Label htmlFor="purpose" className="mb-1 block text-gray-700">Keperluan *</Label>
                  <Input
                    id="purpose"
                    className='text-sm py-2'
                    type="text"
                    placeholder="Contoh: Rapat, presentasi, dll..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}


            {/* Admin: backdate a request */}
            {isAdmin && isPermanent && (
              <div>
                <Label htmlFor="requestDate" className="mb-1 block text-gray-700">Tanggal Permintaan (Admin)</Label>
                <Input
                  id="requestDate"
                  type="date"
                  className="text-sm"
                  value={requestDate}
                  max={today}
                  onChange={(e) => setRequestDate(e.target.value)}
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Ubah jika mencatat permintaan yang sudah terjadi.</p>
              </div>
            )}

            {/* Admin: log a borrowing that is already finished */}
            {isAdmin && isBorrowable && (
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReturned}
                  onChange={(e) => setAutoReturned(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">Sudah dikembalikan</span>
                  <span className="block text-[11px] text-gray-500">
                    Barang sudah dipinjam dan sudah kembali. Dicatat sebagai riwayat, stok tidak berubah, dan email tidak dikirim.
                  </span>
                </span>
              </label>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="mb-1 block text-gray-700">Catatan (Opsional)</Label>
              <textarea
                id="notes"
                placeholder="Tambahkan catatan jika diperlukan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent min-h-[80px] text-sm"
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
                {loading
                  ? 'Memproses...'
                  : isBorrowable
                    ? (isAdmin && autoReturned ? 'Simpan Riwayat' : 'Pinjam')
                    : 'Ambil'}
              </Button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  )
}
