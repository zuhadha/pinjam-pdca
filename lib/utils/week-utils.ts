// Week numbering used by the admin dashboard.
// Weeks start on Monday, week 1 is the week containing 1 January, and every week is
// cut at the year boundary, so each date belongs to exactly one week of its own year.

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const MONTH_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const DAY_MS = 86_400_000

/** Days between 1 Jan and the given date (0-based), ignoring time of day and DST. */
function dayOfYearIndex(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1)
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((current - start) / DAY_MS)
}

/** How many days 1 Jan sits after the Monday of its week (Mon = 0 … Sun = 6). */
function jan1Offset(year: number): number {
  return (new Date(year, 0, 1).getDay() + 6) % 7
}

function daysInYear(year: number): number {
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365
}

/** Week number (1-based) of a date within its calendar year. */
export function weekOfYear(date: Date): number {
  return Math.floor((dayOfYearIndex(date) + jan1Offset(date.getFullYear())) / 7) + 1
}

export function weeksInYear(year: number): number {
  return weekOfYear(new Date(year, 11, 31))
}

/** First and last date of a week, clamped to the year. */
export function weekRange(year: number, week: number): { start: Date; end: Date } {
  const offset = jan1Offset(year)
  const startIndex = Math.max(0, (week - 1) * 7 - offset)
  const endIndex = Math.min(daysInYear(year) - 1, (week - 1) * 7 - offset + 6)
  return {
    start: new Date(year, 0, 1 + startIndex),
    end: new Date(year, 0, 1 + endIndex),
  }
}

/** e.g. "1 – 5 Jan" or "27 Jan – 2 Feb" */
export function formatWeekRange(year: number, week: number): string {
  const { start, end } = weekRange(year, week)
  const startLabel = start.getMonth() === end.getMonth()
    ? `${start.getDate()}`
    : `${start.getDate()} ${MONTH_SHORT[start.getMonth()]}`
  return `${startLabel} – ${end.getDate()} ${MONTH_SHORT[end.getMonth()]}`
}

/** Weeks that overlap the given months (1-12). No months = every week of the year. */
export function weeksForMonths(year: number, months: number[]): number[] {
  if (months.length === 0) {
    return Array.from({ length: weeksInYear(year) }, (_, i) => i + 1)
  }
  const weeks = new Set<number>()
  for (const month of months) {
    const first = weekOfYear(new Date(year, month - 1, 1))
    const last = weekOfYear(new Date(year, month, 0))
    for (let w = first; w <= last; w++) weeks.add(w)
  }
  return Array.from(weeks).sort((a, b) => a - b)
}

/** Parse "1,2,3" into sorted unique integers within [min, max]. */
export function parseNumberList(value: string | undefined | null, min: number, max: number): number[] {
  if (!value) return []
  const nums = value
    .split(',')
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isInteger(n) && n >= min && n <= max)
  return Array.from(new Set(nums)).sort((a, b) => a - b)
}

/** Short summary like "Jan – Mar", "Jan, Mar, Mei" or "5 bulan". */
export function summarizeMonths(months: number[]): string {
  if (months.length === 0) return 'Semua bulan'
  if (months.length === 1) return MONTH_LONG[months[0] - 1]
  const contiguous = months.every((m, i) => i === 0 || m === months[i - 1] + 1)
  if (contiguous) return `${MONTH_SHORT[months[0] - 1]} – ${MONTH_SHORT[months[months.length - 1] - 1]}`
  if (months.length <= 3) return months.map((m) => MONTH_SHORT[m - 1]).join(', ')
  return `${months.length} bulan`
}

/** Short summary like "W5", "W5 – W8", "W1, W3" or "6 minggu". */
export function summarizeWeeks(weeks: number[]): string {
  if (weeks.length === 0) return 'Semua minggu'
  if (weeks.length === 1) return `W${weeks[0]}`
  const contiguous = weeks.every((w, i) => i === 0 || w === weeks[i - 1] + 1)
  if (contiguous) return `W${weeks[0]} – W${weeks[weeks.length - 1]}`
  if (weeks.length <= 3) return weeks.map((w) => `W${w}`).join(', ')
  return `${weeks.length} minggu`
}
