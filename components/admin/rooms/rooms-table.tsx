'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DoorOpen, Edit, Loader2, MapPin, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { useSessionState } from '@/lib/hooks/use-session-state'
import { deleteRoom, type AdminRoom } from '@/lib/actions/room-admin-actions'

function facilitiesText(facilities: string | null) {
  return (facilities ?? '')
    .split(/\r?\n|,/)
    .map((f) => f.trim())
    .filter(Boolean)
    .join(' · ')
}

/** Room list for Kelola Ruangan, laid out like the Kelola Barang table. */
export function RoomsTable({ rooms }: { rooms: AdminRoom[] }) {
  const router = useRouter()
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; room: AdminRoom | null }>({ open: false, room: null })
  // Kept in sessionStorage so filters survive going to the edit page and back
  const [filters, setFilters] = useSessionState('admin-rooms-filters', {
    search: '',
    status: 'all',
    location: 'all',
    page: 1,
  })
  const { search, status, location } = filters
  const perPage = 10

  const updateFilter = (key: 'search' | 'status' | 'location', value: string) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  const setCurrentPage = (page: number) => setFilters((prev) => ({ ...prev, page }))
  const hasActiveFilters = !!search || status !== 'all' || location !== 'all'

  const locations = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.area?.trim()).filter((a): a is string => !!a))).sort(),
    [rooms]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rooms.filter((r) => {
      if (q && ![r.name, r.area ?? '', r.facilities ?? ''].some((v) => v.toLowerCase().includes(q))) return false
      if (status !== 'all' && r.status !== status) return false
      if (location !== 'all' && r.area?.trim() !== location) return false
      return true
    })
  }, [rooms, search, status, location])

  const totalPages = Math.ceil(filtered.length / perPage)
  const currentPage = Math.min(Math.max(filters.page, 1), Math.max(totalPages, 1))
  const pageRooms = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const confirmDelete = async () => {
    const room = deleteDialog.room
    if (!room) return
    setDeleteLoading(room.id)
    const result = await deleteRoom(room.id)
    setDeleteLoading(null)
    setDeleteDialog({ open: false, room: null })
    if (result.error) toast.error(result.error)
    else {
      toast.success(`${room.name} berhasil dihapus`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <Input
          placeholder="Cari nama, lokasi, atau fasilitas..."
          value={search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="h-auto text-sm leading-none sm:max-w-xs"
        />
        <Select value={status} onValueChange={(v) => updateFilter('status', v)}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="available">Bisa dibooking</SelectItem>
            <SelectItem value="maintenance">Dalam perbaikan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={location} onValueChange={(v) => updateFilter('location', v)}>
          <SelectTrigger className="sm:w-[220px]">
            <SelectValue placeholder="Semua Lokasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Lokasi</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <button
            onClick={() => setFilters({ search: '', status: 'all', location: 'all', page: 1 })}
            className="text-sm text-gray-500 underline-offset-2 hover:text-primary-600 hover:underline"
          >
            Reset filter
          </button>
        )}
        <div className="ml-auto flex items-center text-sm text-gray-600">{filtered.length} ruangan</div>
      </div>

      {pageRooms.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <DoorOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>Tidak ada ruangan ditemukan</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ruangan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kapasitas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Booking Mendatang</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {pageRooms.map((room) => {
                  const facilities = facilitiesText(room.facilities)
                  return (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {room.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              loading="lazy"
                              decoding="async"
                              src={room.images[0].public_url}
                              alt={room.name}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                              <DoorOpen className="h-6 w-6" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{room.name}</div>
                            {facilities && <div className="line-clamp-1 text-sm text-gray-500">{facilities}</div>}
                            {room.area && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-tight text-primary-600">
                                <MapPin className="h-3 w-3" />
                                {room.area}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {room.max_people ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-gray-400" />
                            {room.max_people} orang
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={room.status === 'available' ? 'success' : 'warning'}>
                          {room.status === 'available' ? 'Bisa dibooking' : 'Dalam perbaikan'}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <span className={room.upcoming_count ? 'font-medium text-gray-900' : 'text-gray-400'}>{room.upcoming_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/rooms/edit/${room.id}`}
                            className="p-1 text-gray-500 transition-colors hover:text-primary-600"
                            title="Edit Ruangan"
                            aria-label={`Edit ${room.name}`}
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => setDeleteDialog({ open: true, room })}
                            disabled={deleteLoading === room.id}
                            className="p-1 text-gray-500 transition-colors hover:text-red-600"
                            title="Hapus Ruangan"
                            aria-label={`Hapus ${room.name}`}
                          >
                            {deleteLoading === room.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="w-full pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={perPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, room: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Ruangan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus ruangan &quot;{deleteDialog.room?.name}&quot;? Ruangan hilang dari halaman booking,
              riwayat booking lama tetap tersimpan. Ruangan yang masih punya booking mendatang tidak bisa dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {deleteLoading ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
