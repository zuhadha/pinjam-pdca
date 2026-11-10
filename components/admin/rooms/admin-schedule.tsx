'use client'

import { useState } from 'react'
import { RoomCalendar, type DateRange, type RoomCalendarProps } from '@/components/rooms/room-calendar'
import type { CalendarBooking } from '@/lib/rooms/types'
import { BookingActionsModal } from './booking-actions-modal'

/** The shared calendar, with admin actions on every booking. */
export function AdminSchedule(props: Omit<RoomCalendarProps, 'basePath' | 'baseQuery' | 'onSelect'>) {
  const [selected, setSelected] = useState<CalendarBooking | null>(null)
  const [range, setRange] = useState<DateRange | undefined>()
  const roomName = selected ? props.rooms.find((r) => r.id === selected.room_id)?.name ?? '-' : ''

  return (
    <>
      <RoomCalendar {...props} basePath="/admin/room-bookings" onSelect={(b, r) => {
          setSelected(b)
          setRange(r)
        }}
      />
      <BookingActionsModal booking={selected} range={range} roomName={roomName} rooms={props.rooms} onClose={() => setSelected(null)} />
    </>
  )
}
