/**
 * Room booking emails. Plain server module: call it from server actions only.
 * Every sender swallows its own errors so a mail outage never breaks a booking.
 */
import { render } from '@react-email/components'
import { sendEmail } from './brevo'
import RoomBookingEmail, { type RoomEmailDate, type RoomBookingEmailProps } from './templates/room-booking-email'
import { formatDateLong, shortTime } from '@/lib/rooms/dates'

export interface RoomEmailReservation {
  borrower_name: string
  department: string
  phone_number: string
  email: string | null
  agenda: string
  people_count: number | null
  recurrence_summary: string
}

export interface RoomEmailBooking {
  booking_date: string
  start_time: string
  end_time: string
  status: RoomEmailDate['status']
}

function appUrl() {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function manageUrl(token: string) {
  return `${appUrl()}/rooms/booking/${token}`
}

function toDates(bookings: RoomEmailBooking[]): RoomEmailDate[] {
  return bookings.map((b) => ({
    label: formatDateLong(b.booking_date),
    time: `${shortTime(b.start_time)}–${shortTime(b.end_time)}`,
    status: b.status,
  }))
}

function baseDetails(r: RoomEmailReservation, roomName: string) {
  return [
    { label: 'Ruangan', value: roomName },
    { label: 'Agenda', value: r.agenda },
    { label: 'Peminjam', value: `${r.borrower_name} · ${r.department}` },
    { label: 'Pengulangan', value: r.recurrence_summary },
  ]
}

async function send(to: string, subject: string, props: RoomBookingEmailProps) {
  try {
    const html = await render(RoomBookingEmail(props))
    await sendEmail(to, subject, html)
  } catch (err) {
    console.error(`[RoomEmail] Failed to send "${subject}" to ${to}:`, err)
  }
}

/** After a submission: one email to the borrower, one to each admin. */
export async function sendRoomSubmittedEmails(params: {
  reservation: RoomEmailReservation
  roomName: string
  bookings: RoomEmailBooking[]
  token: string
  adminEmails: string[]
}) {
  const { reservation: r, roomName, bookings, token, adminEmails } = params
  const waitCount = bookings.filter((b) => b.status === 'waitlisted').length
  const okCount = bookings.length - waitCount
  const dates = toDates(bookings)

  const summary =
    waitCount === 0
      ? `Semua ${okCount} tanggal terkonfirmasi.`
      : okCount === 0
        ? `Semua ${waitCount} tanggal masuk daftar tunggu karena ruangan sudah dibooking.`
        : `${okCount} tanggal terkonfirmasi, ${waitCount} tanggal masuk daftar tunggu.`

  if (r.email) {
    await send(r.email, `Booking ${roomName} — ${waitCount ? 'ada daftar tunggu' : 'terkonfirmasi'}`, {
      preview: summary,
      heading: waitCount ? 'Booking tercatat, sebagian menunggu' : 'Booking ruangan terkonfirmasi',
      paragraphs: [
        `Halo ${r.borrower_name},`,
        summary,
        ...(waitCount
          ? ['Untuk tanggal di daftar tunggu, admin akan menghubungi Anda bila ruangan kosong.']
          : []),
      ],
      details: baseDetails(r, roomName),
      dates,
      buttonLabel: 'Lihat atau batalkan booking',
      buttonUrl: manageUrl(token),
      footnote: 'Batalkan lewat tombol di atas bila agenda tidak jadi, agar ruangan bisa dipakai peminjam lain.',
    })
  }

  for (const admin of adminEmails) {
    await send(admin, `[INVENSA] Booking ruangan baru — ${roomName}${waitCount ? ` (${waitCount} daftar tunggu)` : ''}`, {
      preview: `${r.borrower_name} (${r.department}) membooking ${roomName}`,
      heading: `Booking baru: ${roomName}`,
      paragraphs: [summary],
      details: [...baseDetails(r, roomName), { label: 'Telepon', value: r.phone_number }],
      dates,
      buttonLabel: 'Buka dashboard admin',
      buttonUrl: `${appUrl()}/admin/room-bookings`,
    })
  }
}

/** Borrower is told one date moved off the waiting list, or was cancelled by admin. */
export async function sendRoomStatusEmail(params: {
  kind: 'promoted' | 'cancelled' | 'changed'
  reservation: RoomEmailReservation
  roomName: string
  booking: RoomEmailBooking
  token: string
  reason?: string | null
  /** 'changed': how many dates were moved */
  changedCount?: number
}) {
  const { kind, reservation: r, roomName, booking, token, reason, changedCount = 1 } = params
  if (!r.email) return
  const when = `${formatDateLong(booking.booking_date)}, ${shortTime(booking.start_time)}–${shortTime(booking.end_time)}`

  if (kind === 'changed') {
    await send(r.email, `Booking ${r.agenda} diubah — ${roomName}`, {
      preview: `Jadwal baru: ${roomName}, ${when}`,
      heading: 'Jadwal booking diubah',
      paragraphs: [
        `Halo ${r.borrower_name},`,
        changedCount > 1
          ? `Admin mengubah ${changedCount} tanggal booking Anda. Jadwal baru mulai ${when} di ${roomName}.`
          : `Admin mengubah booking Anda menjadi ${when} di ${roomName}.`,
        ...(booking.status === 'waitlisted'
          ? ['Jadwal baru ini masih bentrok dengan booking lain, jadi masuk daftar tunggu. Admin akan menghubungi Anda.']
          : []),
      ],
      details: baseDetails(r, roomName),
      dates: toDates([booking]),
      buttonLabel: 'Lihat semua tanggal',
      buttonUrl: manageUrl(token),
    })
    return
  }

  if (kind === 'promoted') {
    await send(r.email, `Booking ${roomName} terkonfirmasi — ${formatDateLong(booking.booking_date)}`, {
      preview: `Ruangan ${roomName} sekarang milik Anda pada ${when}`,
      heading: 'Daftar tunggu Anda terkonfirmasi',
      paragraphs: [`Halo ${r.borrower_name},`, `Ruangan kosong dan booking Anda pada ${when} sekarang terkonfirmasi.`],
      details: baseDetails(r, roomName),
      dates: toDates([booking]),
      buttonLabel: 'Lihat booking',
      buttonUrl: manageUrl(token),
    })
  } else {
    await send(r.email, `Booking ${roomName} dibatalkan — ${formatDateLong(booking.booking_date)}`, {
      preview: `Booking ${roomName} pada ${when} dibatalkan admin`,
      heading: 'Booking dibatalkan',
      paragraphs: [
        `Halo ${r.borrower_name},`,
        `Admin membatalkan booking Anda pada ${when}.`,
        ...(reason ? [`Alasan: ${reason}`] : []),
      ],
      details: baseDetails(r, roomName),
      dates: toDates([booking]),
      buttonLabel: 'Lihat booking',
      buttonUrl: manageUrl(token),
    })
  }
}

/** Admins are told a borrower freed a slot that has people waiting. */
export async function sendAdminBorrowerCancelledEmail(params: {
  reservation: RoomEmailReservation
  roomName: string
  bookings: RoomEmailBooking[]
  waitingCount: number
  adminEmails: string[]
}) {
  const { reservation: r, roomName, bookings, waitingCount, adminEmails } = params
  for (const admin of adminEmails) {
    await send(admin, `[INVENSA] ${roomName} kosong — ${waitingCount} di daftar tunggu`, {
      preview: `${r.borrower_name} membatalkan ${bookings.length} tanggal`,
      heading: `${r.borrower_name} membatalkan booking`,
      paragraphs: [
        `${bookings.length} tanggal dibatalkan oleh peminjam. ${waitingCount} booking di daftar tunggu bisa dikonfirmasi.`,
      ],
      details: baseDetails(r, roomName),
      dates: toDates(bookings.map((b) => ({ ...b, status: 'cancelled' as const }))),
      buttonLabel: 'Pilih dari daftar tunggu',
      buttonUrl: `${appUrl()}/admin/room-bookings`,
    })
  }
}
