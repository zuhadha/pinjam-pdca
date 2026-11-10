import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getReservationByToken } from '@/lib/actions/room-actions'
import { ManageBooking } from '@/components/rooms/manage-booking'
import { BookingSummary } from '@/components/rooms/booking-summary'

export const metadata: Metadata = {
  title: 'Booking Saya · INVENSA',
  robots: { index: false, follow: false },
}

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ baru?: string }>
}) {
  const { token } = await params
  const { baru } = await searchParams
  const data = await getReservationByToken(token)
  if (!data) notFound()

  return (
    <main className="min-h-screen bg-[#f2f4f7]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
          <Link href="/rooms" className="hover:text-gray-900 hover:underline">
            Ruangan
          </Link>
          <span aria-hidden> / </span>
          <span className="text-gray-900">Booking saya</span>
        </nav>

        <BookingSummary data={data} justBooked={!!baru} />

        <ManageBooking token={token} bookings={data.bookings} today={data.today} />
      </div>
    </main>
  )
}
