import { RoomBookingsSection } from '@/components/admin/rooms/room-admin-section'

export default async function RoomBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ cal?: string; date?: string; room?: string }>
}) {
  const params = await searchParams
  return <RoomBookingsSection cal={params.cal} date={params.date} room={params.room} />
}
