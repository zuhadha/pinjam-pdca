import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoomForm } from '@/components/admin/rooms/room-form'
import { getAdminRooms } from '@/lib/actions/room-admin-actions'

export default async function CreateRoomPage() {
  const rooms = await getAdminRooms()
  const nextSortOrder = rooms.reduce((max, r) => Math.max(max, r.sort_order), 0) + 1

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/rooms">
          <Button variant="ghost" size="sm" aria-label="Kembali ke Kelola Ruangan">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tambah Ruangan Baru</h1>
      </div>

      <RoomForm mode="create" nextSortOrder={nextSortOrder} />
    </div>
  )
}
