import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoomsTable } from '@/components/admin/rooms/rooms-table'
import { getAdminRooms } from '@/lib/actions/room-admin-actions'

export default async function RoomsPage() {
  const rooms = await getAdminRooms()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Ruangan</h1>
          <p className="mt-2 text-gray-600">Kelola ruangan yang bisa dibooking</p>
        </div>
        <Link href="/admin/rooms/create">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Tambah
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Ruangan</CardTitle>
          <CardDescription>Kelola semua ruangan dengan filter dan pencarian</CardDescription>
        </CardHeader>
        <CardContent>
          <RoomsTable rooms={rooms} />
        </CardContent>
      </Card>
    </div>
  )
}
