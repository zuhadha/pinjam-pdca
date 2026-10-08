'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Loader2, RotateCcw } from 'lucide-react'
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </div>
  )
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
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {/* Year Filter */}
        <Field label="Tahun">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 w-[110px]">
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
        </Field>

        {/* Month Filter */}
        <Field label="Bulan">
          <Select value={month || 'all'} onValueChange={(v) => setMonth(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-[160px]">
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
        </Field>

        {/* Date Range Filter */}
        <Field label="Rentang Tanggal">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Tanggal mulai"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 min-w-0 flex-1 px-2 text-sm sm:w-[152px] sm:flex-none"
            />
            <span className="shrink-0 text-sm text-gray-400">s.d.</span>
            <Input
              type="date"
              aria-label="Tanggal selesai"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 min-w-0 flex-1 px-2 text-sm sm:w-[152px] sm:flex-none"
            />
          </div>
        </Field>

        {/* Actions */}
        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={(!hasActiveFilter && !isDirty) || isPending}
            className="h-9 px-3 text-gray-600"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!isDirty || isPending}
            className="h-9 px-4"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Filter className="mr-2 h-4 w-4" />
            )}
            Filter
          </Button>
        </div>
      </div>
    </div>
  )
}
