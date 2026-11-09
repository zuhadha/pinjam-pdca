'use client'

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, CalendarRange, ChevronDown, Check, Loader2, RotateCcw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRestoreSearchParams } from '@/lib/hooks/use-restore-search-params'
import {
  MONTH_SHORT,
  formatWeekRange,
  parseNumberList,
  summarizeMonths,
  summarizeWeeks,
  weeksForMonths,
  weeksInYear,
} from '@/lib/utils/week-utils'

/** Dropdown panel that closes on outside click or Escape. */
function FilterPopover({
  label,
  value,
  icon,
  active,
  open,
  onOpenChange,
  children,
}: {
  label: string
  value: string
  icon: ReactNode
  active: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className={`flex h-11 w-full sm:w-auto sm:min-w-[170px] items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors ${
          open
            ? 'border-primary-600 ring-2 ring-primary-100 bg-white'
            : active
              ? 'border-primary-300 bg-primary-50/60 hover:border-primary-400'
              : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <span className={active ? 'text-primary-600' : 'text-gray-400'}>{icon}</span>
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</span>
          <span className={`truncate font-semibold ${active ? 'text-primary-700' : 'text-gray-900'}`}>{value}</span>
        </span>
        <ChevronDown className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

function PanelFooter({ onClear, onApply, clearLabel }: { onClear: () => void; onApply: () => void; clearLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2.5">
      <button type="button" onClick={onClear} className="text-xs font-medium text-gray-500 hover:text-gray-800">
        {clearLabel}
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
      >
        Terapkan
      </button>
    </div>
  )
}

function toggle(list: number[], value: number) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value].sort((a, b) => a - b)
}

/** Dashboard period filter: year, months (multi), weeks (multi) and chart grouping. */
export function MonthFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Keep the chosen filters when coming back to the dashboard
  useRestoreSearchParams('admin-dashboard-filters')

  const thisYear = new Date().getFullYear()
  const year = parseInt(searchParams.get('year') || '', 10) || thisYear
  // `month` is the old single-month param, still accepted for saved links
  const months = parseNumberList(searchParams.get('months') ?? searchParams.get('month'), 1, 12)
  const weeks = parseNumberList(searchParams.get('weeks'), 1, weeksInYear(year))
  const view = searchParams.get('view') === 'week' ? 'week' : 'month'

  const [openPanel, setOpenPanel] = useState<'months' | 'weeks' | null>(null)
  const [draftMonths, setDraftMonths] = useState<number[]>(months)
  const [draftWeeks, setDraftWeeks] = useState<number[]>(weeks)

  // Always offer the current year and the 4 before it (plus the selected one if older)
  const years = Array.from(new Set([...Array.from({ length: 5 }, (_, i) => thisYear - i), year])).sort((a, b) => b - a)
  const weekOptions = weeksForMonths(year, months)

  const navigate = (next: { year?: number; months?: number[]; weeks?: number[]; view?: 'month' | 'week' }) => {
    const nextYear = next.year ?? year
    const nextMonths = next.months ?? months
    // Drop weeks that fall outside the chosen months/year
    const allowedWeeks = new Set(weeksForMonths(nextYear, nextMonths))
    const nextWeeks = (next.weeks ?? weeks).filter((w) => allowedWeeks.has(w))
    const nextView = next.view ?? view

    const params = new URLSearchParams()
    params.set('year', String(nextYear))
    if (nextMonths.length) params.set('months', nextMonths.join(','))
    if (nextWeeks.length) params.set('weeks', nextWeeks.join(','))
    if (nextView === 'week') params.set('view', 'week')

    startTransition(() => {
      router.push(`/admin?${params.toString()}`)
    })
  }

  const openMonths = (open: boolean) => {
    if (open) setDraftMonths(months)
    setOpenPanel(open ? 'months' : null)
  }
  const openWeeks = (open: boolean) => {
    if (open) setDraftWeeks(weeks)
    setOpenPanel(open ? 'weeks' : null)
  }

  const hasFilters = months.length > 0 || weeks.length > 0 || year !== thisYear || view !== 'month'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {/* Year */}
          <div className="flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white pl-3 sm:w-auto">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Tahun</span>
            <Select value={String(year)} onValueChange={(v) => navigate({ year: parseInt(v, 10), months: [], weeks: [] })}>
              <SelectTrigger className="h-full flex-1 sm:w-[96px] border-0 bg-transparent font-semibold text-gray-900 focus:ring-0">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Months (multi) */}
          <FilterPopover
            label="Bulan"
            value={summarizeMonths(months)}
            icon={<CalendarDays className="h-4 w-4" />}
            active={months.length > 0}
            open={openPanel === 'months'}
            onOpenChange={openMonths}
          >
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Pilih bulan · {year}</p>
                <p className="text-[11px] text-gray-400">
                  {draftMonths.length ? `${draftMonths.length} dipilih` : 'Semua bulan'}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {MONTH_SHORT.map((label, i) => {
                  const m = i + 1
                  const selected = draftMonths.includes(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDraftMonths((d) => toggle(d, m))}
                      aria-pressed={selected}
                      className={`rounded-md border py-2 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
            <PanelFooter
              clearLabel="Semua bulan"
              onClear={() => setDraftMonths([])}
              onApply={() => { setOpenPanel(null); navigate({ months: draftMonths }) }}
            />
          </FilterPopover>

          {/* Weeks (multi) */}
          <FilterPopover
            label="Minggu"
            value={summarizeWeeks(weeks)}
            icon={<CalendarRange className="h-4 w-4" />}
            active={weeks.length > 0}
            open={openPanel === 'weeks'}
            onOpenChange={openWeeks}
          >
            <div className="p-3 pb-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">
                  Pilih minggu · {months.length ? summarizeMonths(months) : year}
                </p>
                <p className="text-[11px] text-gray-400">
                  {draftWeeks.length ? `${draftWeeks.length} dipilih` : 'Semua minggu'}
                </p>
              </div>
              <div className="-mx-1 max-h-64 overflow-y-auto px-1">
                {weekOptions.map((w) => {
                  const selected = draftWeeks.includes(w)
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setDraftWeeks((d) => toggle(d, w))}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                        selected ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                          selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className={`w-9 font-semibold ${selected ? 'text-primary-700' : 'text-gray-900'}`}>W{w}</span>
                      <span className="text-xs text-gray-500">{formatWeekRange(year, w)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <PanelFooter
              clearLabel="Semua minggu"
              onClear={() => setDraftWeeks([])}
              onApply={() => { setOpenPanel(null); navigate({ weeks: draftWeeks }) }}
            />
          </FilterPopover>
        </div>

        <div className="flex items-center gap-3 lg:ml-auto">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-label="Memuat" />}

          {hasFilters && (
            <button
              type="button"
              onClick={() => navigate({ year: thisYear, months: [], weeks: [], view: 'month' })}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}

          {/* Chart grouping: per month (default) or per week number */}
          <div className="flex flex-1 rounded-lg bg-gray-100 p-1 lg:flex-none" role="group" aria-label="Tampilan grafik">
            {([
              { value: 'month', label: 'Bulanan' },
              { value: 'week', label: 'Mingguan' },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => option.value !== view && navigate({ view: option.value })}
                aria-pressed={view === option.value}
                className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  view === option.value ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
