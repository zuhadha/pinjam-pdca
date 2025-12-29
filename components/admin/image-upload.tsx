'use client'

import { useState, useRef } from 'react'
import { uploadItemImage, deleteItemImage, reorderItemImages } from '@/lib/actions/image-actions'
import { toast } from 'sonner'
import { X, Upload, GripVertical } from 'lucide-react'
import { ImageCropModal } from './image-crop-modal'

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB (changed from 5MB)

interface ImageUploadProps {
  itemId?: string
  images: any[]
  onImagesChange: (images: any[]) => void
  maxImages?: number
}

export function ImageUpload({ 
  itemId, 
  images, 
  onImagesChange,
  maxImages = 5 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [ dragOver, setDragOver] = useState(false)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [fileToProcess, setFileToProcess] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !itemId) return

    const remainingSlots = maxImages - images.length
    if (files.length > remainingSlots) {
      toast.error(`Maksimal ${maxImages} gambar. Anda bisa upload ${remainingSlots} gambar lagi.`)
      return
    }

    // Only process first file (one at a time for cropping)
    const file = files[0]
    
    // Validate file size BEFORE crop (1MB max)
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Ukuran file terlalu besar. Maximum 1MB (file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP')
      return
    }

    // Show crop modal
    setFileToProcess(file)
    setCropModalOpen(true)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropModalOpen(false)
    setUploading(true)

    if (!itemId || !fileToProcess) return

    // Convert blob to File
    const croppedFile = new File(
      [croppedBlob], 
      fileToProcess.name.replace(/\.\w+$/, '.jpg'), // Force .jpg extension
      { type: 'image/jpeg' }
    )
    
    const result = await uploadItemImage({ itemId, file: croppedFile })
    
    if (result.error) {
      toast.error(result.error)
      setUploading(false)
      return
    }

    if (result.image) {
      onImagesChange([...images, result.image])
      toast.success('Gambar berhasil diupload')
    }

    setUploading(false)
    setFileToProcess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (imageId: string) => {
    if (!confirm('Hapus gambar ini?')) return

    const result = await deleteItemImage(imageId)
    
    if (result.error) {
      toast.error(result.error)
      return
    }

    onImagesChange(images.filter(img => img.id !== imageId))
    toast.success('Gambar berhasil dihapus')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleDragStart = (index: number) => {
    setDraggingIndex(index)
  }

  const handleDragEnd = () => {
    setDraggingIndex(null)
  }

  const handleDragOverImage = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    
    if (draggingIndex === null || draggingIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggingIndex]
    
    newImages.splice(draggingIndex, 1)
    newImages.splice(index, 0, draggedImage)
    
    onImagesChange(newImages)
    setDraggingIndex(index)
  }

  const handleReorderComplete = async () => {
    if (!itemId) return

    const imageIds = images.map(img => img.id)
    const result = await reorderItemImages(itemId, imageIds)
    
    if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && itemId && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${dragOver 
              ? 'border-primary-600 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-700 font-medium mb-2">
            {uploading ? 'Mengupload...' : 'Klik atau drag & drop gambar di sini'}
          </p>
          <p className="text-sm text-gray-500">
            JPG, PNG, atau WebP (Max 5MB)
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {images.length} / {maxImages} gambar
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}

      {/* Warning if no itemId */}
      {!itemId && images.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          ℹ️ Simpan barang terlebih dahulu untuk mengupload gambar
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Gambar Barang ({images.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={() => { handleDragEnd(); handleReorderComplete(); }}
                onDragOver={(e) => handleDragOverImage(e, index)}
                className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-400 transition-colors cursor-move"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={image.image_url}
                    alt={image.file_name || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Order Badge */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">
                  {index + 1}
                </div>

                {/* Drag Handle */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(image.id)
                  }}
                  className="absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus gambar"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Overlay on drag */}
                {draggingIndex === index && (
                  <div className="absolute inset-0 bg-primary-600/30 border-2 border-primary-600" />
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            💡 Drag & drop gambar untuk mengubah urutan
          </p>
        </div>
      )}

    {/* Crop Modal */}
    <ImageCropModal
      isOpen={cropModalOpen}
      imageFile={fileToProcess}
      onCropComplete={handleCropComplete}
      onCancel={() => {
        setCropModalOpen(false)
        setFileToProcess(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }}
    />
  </div>
  )
}
