import { MAX_OCCURRENCES, MAX_RECURRENCE_DAYS } from './constants'
import {
  DAY_NAMES_SHORT,
  addDays,
  addMonthsClamped,
  diffDays,
  formatDateShort,
  isDateString,
  isoWeekday,
} from './dates'

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly'

export interface RecurrenceRule {
  type: RecurrenceType
  /** weekly: ISO weekdays, 1 = Monday .. 7 = Sunday */
  weekdays?: number[]
  /** daily: skip Saturday and Sunday */
  skipWeekends?: boolean
  endType?: 'until' | 'count'
  until?: string
  count?: number
}

export type ExpandResult = { dates: string[]; error?: undefined } | { dates: []; error: string }

/**
 * Turns a start date and a rule into the list of booking dates.
 * Monthly repeats on the same day of month; months without that day use their last day.
 */
export function expandDates(startDate: string, rule: RecurrenceRule): ExpandResult {
  if (!isDateString(startDate)) return { dates: [], error: 'Tanggal tidak valid' }
  if (rule.type === 'none') return { dates: [startDate] }

  const endType = rule.endType ?? 'until'
  let until: string
  let count = Infinity

  if (endType === 'until') {
    if (!isDateString(rule.until)) return { dates: [], error: 'Isi tanggal akhir pengulangan' }
    if (rule.until < startDate) return { dates: [], error: 'Tanggal akhir harus setelah tanggal mulai' }
    if (diffDays(startDate, rule.until) > MAX_RECURRENCE_DAYS) {
      return { dates: [], error: 'Pengulangan maksimal 1 tahun' }
    }
    until = rule.until
  } else {
    const n = Number(rule.count)
    if (!Number.isInteger(n) || n < 1) return { dates: [], error: 'Isi jumlah pengulangan' }
    if (n > MAX_OCCURRENCES) return { dates: [], error: `Maksimal ${MAX_OCCURRENCES} kali` }
    count = n
    until = addDays(startDate, MAX_RECURRENCE_DAYS)
  }

  const dates: string[] = []
  const push = (d: string) => {
    dates.push(d)
    return dates.length >= count
  }

  if (rule.type === 'daily') {
    for (let d = startDate; d <= until; d = addDays(d, 1)) {
      if (rule.skipWeekends && isoWeekday(d) >= 6) continue
      if (push(d)) break
    }
  } else if (rule.type === 'weekly') {
    const days = normaliseWeekdays(rule.weekdays, startDate)
    for (let d = startDate; d <= until; d = addDays(d, 1)) {
      if (!days.includes(isoWeekday(d))) continue
      if (push(d)) break
    }
  } else if (rule.type === 'monthly') {
    const dayOfMonth = Number(startDate.slice(8, 10))
    for (let k = 0; ; k++) {
      const d = addMonthsClamped(startDate, k, dayOfMonth)
      if (d > until) break
      if (push(d)) break
    }
  } else {
    return { dates: [], error: 'Jenis pengulangan tidak dikenal' }
  }

  if (dates.length === 0) return { dates: [], error: 'Tidak ada tanggal yang cocok dengan pola ini' }
  if (dates.length > MAX_OCCURRENCES) {
    return { dates: [], error: `Pola ini menghasilkan ${dates.length} tanggal. Maksimal ${MAX_OCCURRENCES}.` }
  }
  return { dates }
}

export function normaliseWeekdays(weekdays: number[] | undefined, startDate: string): number[] {
  const valid = Array.from(new Set((weekdays ?? []).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7)))
  return valid.length ? valid.sort() : [isoWeekday(startDate)]
}

/** Human summary: 'Setiap Sen, Rab sampai Sen, 28 Des' */
export function describeRecurrence(rule: RecurrenceRule, startDate: string): string {
  let base: string
  switch (rule.type) {
    case 'none':
      return 'Sekali'
    case 'daily':
      base = rule.skipWeekends ? 'Setiap hari kerja' : 'Setiap hari'
      break
    case 'weekly':
      base = `Setiap ${normaliseWeekdays(rule.weekdays, startDate).map((d) => DAY_NAMES_SHORT[d - 1]).join(', ')}`
      break
    case 'monthly':
      base = `Setiap tanggal ${Number(startDate.slice(8, 10))}`
      break
    default:
      return '-'
  }
  if (rule.endType === 'count' && rule.count) return `${base}, ${rule.count} kali`
  if (rule.until) return `${base} sampai ${formatDateShort(rule.until, true)}`
  return base
}
