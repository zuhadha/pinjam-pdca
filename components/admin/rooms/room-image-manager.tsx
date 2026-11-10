'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { deleteRoomImage, uploadRoomImage } from '@/lib/actions/room-admin-actions'
import { MAX_ROOM_IMAGES } from '@/lib/rooms/constants'
import type { RoomImage } from '@/lib/rooms/types'

/** Shrinks a photo in the browser so it fits the 1 MB server action limit. */
async function resizeImage(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', quality)
  )
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
}

/** Room photos: upload (resized in the browser) and delete. The first photo is the cover. */
export function RoomImageManager({ roomId, images }: { roomId: number; images: RoomImage[] }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [, startTransition] = useTransition()
  const [removing, setRemoving] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const full = images.length >= MAX_ROOM_IMAGES

  const upload = async (files: FileList | File[] | null) => {
    if (!files || !files.length || full) return
    setUploading(true)
    try {
      for (const file of Array.from(files).slice(0, MAX_ROOM_IMAGES - images.length)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name}: bukan foto`)
          continue
        }
        const fd = new FormData()
        fd.set('roomId', String(roomId))
        fd.set('file', await resizeImage(file))
        const res = await uploadRoomImage(fd)
        if (res.error) {
          toast.error(`${file.name}: ${res.error}`)
          break
        }
      }
      router.refresh()
    } catch {
      toast.error('Foto tidak bisa dibaca')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = (id: number) => {
    setRemoving(id)
    startTransition(async () => {
      const res = await deleteRoomImage(id)
      setRemoving(null)
      if (res.error) toast.error(res.error)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {images.map((img, i) => (
            <li key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.public_url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded bg-primary-600 px-1.5 py-0.5 text-[11px] font-medium text-white">Sampul</span>
              )}
              <button
                type="button"
                onClick={() => remove(img.id)}
                disabled={removing === img.id}
                aria-label={`Hapus foto ${i + 1}`}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-600 shadow hover:bg-white"
              >
                {removing === img.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            upload(e.dataTransfer.files)
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary-600" /> : <Upload className="h-8 w-8 text-gray-400" />}
          <span className="text-sm font-medium text-gray-700">{uploading ? 'Mengunggah…' : 'Klik atau seret foto ke sini'}</span>
          <span className="text-xs text-gray-500">
            JPG, PNG, atau WebP · maks {MAX_ROOM_IMAGES} foto ({images.length}/{MAX_ROOM_IMAGES})
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={(e) => upload(e.target.files)}
            className="sr-only"
          />
        </label>
      )}
    </div>
  )
}
