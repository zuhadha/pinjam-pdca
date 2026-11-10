'use client'

import { useRef } from 'react'
import { toast } from 'sonner'
import { getRebookDetails } from '@/lib/actions/room-actions'
import { BookingForm, type BookingFormHandle } from './booking-form'
import { RoomCalendar, type RoomCalendarProps } from './room-calendar'
import type { CalendarBooking, RebookDetails, Room } from '@/lib/rooms/types'

interface Props {
  calendar: Omit<RoomCalendarProps, 'onSlot' | 'onSelect' | 'onRebook'>
  bookableRooms: Room[]
  isAdmin: boolean
  prefill: {
    roomId: number | null
    date: string
    start: string | null
    rebook?: RebookDetails & { bookingId: number }
  } | null
}

/** Booking form above the calendar. Clicking an empty calendar slot fills the form. */
export function RoomsPlanner({ calendar, bookableRooms, isAdmin, prefill }: Props) {
  const form = useRef<BookingFormHandle>(null)

  const toForm = (focusDate = false) => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (focusDate) setTimeout(() => document.getElementById('date')?.focus({ preventScroll: true }), 400)
  }

  const rebook = async (booking: CalendarBooking) => {
    const details = await getRebookDetails(booking.id)
    if (!details) {
      toast.error('Detail booking tidak ditemukan')
      return
    }
    form.current?.rebook(details)
    toast.success('Form terisi. Pilih tanggal baru.')
    toForm(true)
  }

  return (
    <>
      <section id="booking" aria-labelledby="booking-title" className="mt-6 scroll-mt-24 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <h2 id="booking-title" className="mb-5 text-lg font-semibold text-gray-900">
          Booking ruangan
        </h2>
        {bookableRooms.length ? (
          <BookingForm ref={form} rooms={bookableRooms} today={calendar.today} isAdmin={isAdmin} prefill={prefill} />
        ) : (
          <p className="text-sm text-gray-700">Belum ada ruangan yang bisa dibooking.</p>
        )}
      </section>

      <section aria-labelledby="schedule-title" className="mt-8 rounded-lg border border-gray-200 bg-white p-3 sm:p-5">
        <h2 id="schedule-title" className="pb-3 text-lg font-semibold text-gray-900">
          Jadwal
        </h2>
        <RoomCalendar
          {...calendar}
          onSlot={(slot) => {
            form.current?.fill(slot)
            toForm()
          }}
          onRebook={rebook}
        />
      </section>
    </>
  )
}
