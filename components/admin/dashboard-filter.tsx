'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Filter, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const MONTHS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

const defaultYear = new Date().getFullYear().toString()

function readParams(paramsString: string) {
  const p = new URLSearchParams(paramsString)
  return {
    year: p.get('year') || defaultYear,
    month: p.get('month') || '',
    from: p.get('from') || '',
    to: p.get('to') || '',
  }
}

export function DashboardFilter() {
  const searchParams = useSearchParams()
  const paramsString = searchParams.toString()

  // key memaksa form mount ulang dari URL terbaru (apply/back/forward),
  // sehingga perubahan field lokal tidak memicu request ke server
  return <FilterForm key={paramsString} paramsString={paramsString} />
}

function FilterForm({ paramsString }: { paramsString: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const applied = readParams(paramsString)

  const [year, setYear] = useState(applied.year)
  const [month, setMonth] = useState(applied.month)
  const [dateFrom, setDateFrom] = useState(applied.from)
  const [dateTo, setDateTo] = useState(applied.to)

  const hasActiveFilter = Boolean(applied.from || applied.to || applied.month)
  const isDirty =
    year !== applied.year ||
    month !== applied.month ||
    dateFrom !== applied.from ||
    dateTo !== applied.to

  const navigate = (params: URLSearchParams) => {
    startTransition(() => {
      router.push(`/admin?${params.toString()}`)
    })
  }

  // Terapkan filter hanya saat tombol "Filter" ditekan
  const handleApply = () => {
    const params = new URLSearchParams()
    let from = dateFrom
    let to = dateTo
    if (from && to && from > to) {
      const tmp = from
      from = to
      to = tmp
    }

    params.set('year', year)

    if (from || to) {
      // Rentang tanggal menggantikan filter bulan
      if (from) params.set('from', from)
      if (to) params.set('to', to)
    } else if (month) {
      params.set('month', month)
    }

    navigate(params)
  }

  // Reset filter (langsung diterapkan)
  const handleClear = () => {
    const params = new URLSearchParams()
    params.set('year', defaultYear)
    navigate(params)
  }

  const currentYearNum = parseInt(year)
  const baseYearNum = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => Math.max(currentYearNum, baseYearNum) - i)
  if (!years.includes(currentYearNum)) years.push(currentYearNum)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />

      {/* Year Filter */}
      <Select value={year} onValueChange={setYear}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Tahun" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month Filter */}
      <Select value={month || 'all'} onValueChange={(v) => setMonth(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Semua Bulan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Bulan</SelectItem>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Filter */}
      <Input
        type="date"
        aria-label="Tanggal mulai"
        value={dateFrom}
        max={dateTo || undefined}
        onChange={(e) => setDateFrom(e.target.value)}
        className="h-9 w-[150px] px-2 text-sm"
      />
      <span className="text-sm text-gray-500">—</span>
      <Input
        type="date"
        aria-label="Tanggal selesai"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(e) => setDateTo(e.target.value)}
        className="h-9 w-[150px] px-2 text-sm"
      />

      {/* Apply Filter */}
      <Button
        size="sm"
        onClick={handleApply}
        disabled={!isDirty || isPending}
        className="h-9"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filter
      </Button>

      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          aria-label="Reset filter"
          className="h-9 w-9 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {isPending && (
        <span className="text-xs text-gray-500">Memuat...</span>
      )}
    </div>
  )
}
