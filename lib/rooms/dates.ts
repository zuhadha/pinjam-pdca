/**
 * Date helpers that work on plain 'YYYY-MM-DD' strings.
 * Room bookings are wall-clock dates in Jakarta, so all math runs in UTC on the
 * string value and never depends on the server's or the browser's time zone.
 */

export const DAY_NAMES_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] // ISO 1..7
export const DAY_NAMES_LONG = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
export const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/

export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function isTimeString(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value)
}

function toUtc(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function fromUtc(dt: Date): string {
  return dt.toISOString().slice(0, 10)
}

export function addDays(date: string, days: number): string {
  const dt = toUtc(date)
  dt.setUTCDate(dt.getUTCDate() + days)
  return fromUtc(dt)
}

/** Adds months and clamps to the last day of the target month (Jan 31 + 1 month = Feb 28/29). */
export function addMonthsClamped(date: string, months: number, dayOfMonth?: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const wanted = dayOfMonth ?? d
  const target = new Date(Date.UTC(y, m - 1 + months, 1))
  const lastDay = daysInMonth(target.getUTCFullYear(), target.getUTCMonth() + 1)
  target.setUTCDate(Math.min(wanted, lastDay))
  return fromUtc(target)
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** ISO weekday: 1 = Monday .. 7 = Sunday */
export function isoWeekday(date: string): number {
  const day = toUtc(date).getUTCDay()
  return day === 0 ? 7 : day
}

export function diffDays(from: string, to: string): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000)
}

export function startOfWeek(date: string): string {
  return addDays(date, 1 - isoWeekday(date))
}

export function startOfMonth(date: string): string {
  return date.slice(0, 8) + '01'
}

export function endOfMonth(date: string): string {
  const [y, m] = date.split('-').map(Number)
  return `${date.slice(0, 8)}${String(daysInMonth(y, m)).padStart(2, '0')}`
}

/** Today's date in Jakarta. */
export function todayJakarta(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Current Jakarta time as 'HH:MM'. */
export function nowTimeJakarta(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** '09:00:00' -> '09:00' */
export function shortTime(time: string): string {
  return time.slice(0, 5)
}

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd)
}

/** 'Senin, 16 November 2026' */
export function formatDateLong(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${DAY_NAMES_LONG[isoWeekday(date) - 1]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`
}

/** 'Sen, 16 Nov' */
export function formatDateShort(date: string, withYear = false): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${DAY_NAMES_SHORT[isoWeekday(date) - 1]}, ${d} ${MONTH_NAMES_SHORT[m - 1]}${withYear ? ` ${y}` : ''}`
}

/** '16–22 Nov 2026', '30 Nov – 6 Des 2026' */
export function formatRange(from: string, to: string): string {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  if (fy === ty && fm === tm) return `${fd}–${td} ${MONTH_NAMES_SHORT[tm - 1]} ${ty}`
  if (fy === ty) return `${fd} ${MONTH_NAMES_SHORT[fm - 1]} – ${td} ${MONTH_NAMES_SHORT[tm - 1]} ${ty}`
  return `${fd} ${MONTH_NAMES_SHORT[fm - 1]} ${fy} – ${td} ${MONTH_NAMES_SHORT[tm - 1]} ${ty}`
}

export function formatMonth(date: string): string {
  const [y, m] = date.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

/** WhatsApp chat link for an Indonesian number: '0812…' -> 'https://wa.me/62812…' */
export function whatsappLink(phone: string | null | undefined): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)
  return digits.length >= 10 ? `https://wa.me/${digits}` : null
}

/** 'Kam 12, Jum 13, Sen 16 Nov 2026', shortened to the first `max` dates. */
export function formatDateList(dates: string[], max = 8): string {
  const shown = dates.slice(0, max)
  const groups: { ym: string; days: string[] }[] = []
  for (const d of shown) {
    const ym = d.slice(0, 7)
    const label = `${DAY_NAMES_SHORT[isoWeekday(d) - 1]} ${Number(d.slice(8))}`
    const last = groups[groups.length - 1]
    if (last && last.ym === ym) last.days.push(label)
    else groups.push({ ym, days: [label] })
  }
  const multiYear = new Set(groups.map((g) => g.ym.slice(0, 4))).size > 1
  const text = groups
    .map((g, i) => {
      const [y, m] = g.ym.split('-').map(Number)
      const showYear = multiYear || i === groups.length - 1
      return `${g.days.join(', ')} ${MONTH_NAMES_SHORT[m - 1]}${showYear ? ` ${y}` : ''}`
    })
    .join(', ')
  return dates.length > max ? `${text}, +${dates.length - max} lainnya` : text
}
