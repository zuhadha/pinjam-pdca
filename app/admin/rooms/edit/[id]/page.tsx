import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoomForm } from '@/components/admin/rooms/room-form'
import { getAdminRoom } from '@/lib/actions/room-admin-actions'

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const room = await getAdminRoom(Number(id))
  if (!room) redirect('/admin/rooms')

  return (
    <div className="max-w-full space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/rooms">
          <Button variant="ghost" size="sm" aria-label="Kembali ke Kelola Ruangan">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Ruangan</h1>
      </div>

      {/* key: a fresh form when moving between rooms */}
      <RoomForm key={room.id} mode="edit" initialData={room} />
    </div>
  )
}
