import { redirect } from 'next/navigation'

/** The booking form now lives on /rooms, above the calendar. Old links land there. */
export default async function BookRoomRedirect({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; date?: string; start?: string }>
}) {
  const { room, date, start } = await searchParams
  const q = new URLSearchParams()
  if (room) q.set('book_room', room)
  if (date) q.set('book_date', date)
  if (start) q.set('start', start)
  const query = q.toString()
  redirect(`/rooms${query ? `?${query}` : ''}#booking`)
}
