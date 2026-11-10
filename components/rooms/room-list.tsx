import Link from 'next/link'
import type { Room } from '@/lib/rooms/types'

function facilitiesText(facilities: string | null) {
  if (!facilities) return null
  return facilities
    .split(/\r?\n|,/)
    .map((f) => f.trim())
    .filter(Boolean)
    .join(' · ')
}

export function RoomList({ rooms, today }: { rooms: Room[]; today: string }) {
  if (!rooms.length) {
    return <p className="mt-4 rounded-md bg-white px-4 py-8 text-sm text-gray-600">Belum ada ruangan yang terdaftar.</p>
  }

  return (
    <ul className="mt-5 grid gap-x-8 lg:grid-cols-2">
      {rooms.map((room) => {
        const cover = room.images[0]
        const facilities = facilitiesText(room.facilities)
        const maintenance = room.status === 'maintenance'
        return (
          <li key={room.id} className="flex gap-4 border-t border-gray-200 py-5">
            <div className="h-24 w-32 shrink-0 overflow-hidden rounded-md bg-gray-100 sm:h-28 sm:w-40">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover.public_url} alt={`Foto ${room.name}`} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center px-2 text-center text-xs text-gray-600">{room.name}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h3 className="text-base font-semibold text-gray-900">{room.name}</h3>
                {maintenance && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Dalam perbaikan</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray-700">
                {room.max_people ? `Maks ${room.max_people} orang` : 'Kapasitas -'}
                {room.area ? ` · ${room.area}` : ''}
              </p>
              {facilities && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{facilities}</p>}
              <div className="mt-3 flex gap-4 text-sm font-medium">
                <Link href={`/rooms?cal=week&room=${room.id}`} className="text-gray-900 underline-offset-4 hover:underline">
                  Lihat jadwal
                </Link>
                {!maintenance && (
                  <Link
                    href={`/rooms?book_room=${room.id}&book_date=${today}#booking`}
                    className="text-blue-700 underline-offset-4 hover:underline"
                  >
                    Booking
                  </Link>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
