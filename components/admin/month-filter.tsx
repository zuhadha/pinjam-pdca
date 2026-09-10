'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

export function MonthFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentMonth = searchParams.get('month') || ''
  const currentYear = searchParams.get('year') || new Date().getFullYear().toString()

  const handleMonthChange = (value: string) => {
    const monthValue = value === 'all' ? '' : value
    const params = new URLSearchParams(searchParams.toString())

    if (monthValue) {
      params.set('month', monthValue)
    } else {
      params.delete('month')
    }
    params.set('year', currentYear)

    startTransition(() => {
      router.push(`/admin?${params.toString()}`)
    })
  }

  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', value)

    startTransition(() => {
      router.push(`/admin?${params.toString()}`)
    })
  }

  const currentYearNum = parseInt(currentYear)
  const years = Array.from({ length: 5 }, (_, i) => currentYearNum - i)

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />

      {/* Year Filter */}
      <Select value={currentYear} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Tahun" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month Filter */}
      <Select value={currentMonth || 'all'} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Semua Bulan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Bulan</SelectItem>
          {MONTHS.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <span className="text-xs text-gray-500">Memuat...</span>
      )}
    </div>
  )
}
