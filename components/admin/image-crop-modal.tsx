'use client'

import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { X } from 'lucide-react'

interface ImageCropModalProps {
  isOpen: boolean
  imageFile: File | null
  onCropComplete: (croppedBlob: Blob) => void
  onCancel: () => void
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageCropModal({ isOpen, imageFile, onCropComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [imageFile])

  const onCropCompleteCallback = useCallback(
    (croppedArea: any, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageUrl) return

    try {
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels)
      onCropComplete(croppedBlob)
    } catch (error) {
      console.error('Error cropping image:', error)
      alert('Gagal memotong gambar. Silakan coba lagi.')
    }
  }

  if (!isOpen || !imageFile) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl flex flex-col max-h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Crop Gambar ke Persegi</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative flex-shrink-0 bg-gray-900 h-[250px] sm:h-[320px]">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteCallback}
          />
        </div>

        {/* Controls - Horizontal Layout */}
        <div className="p-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap min-w-[70px]">
              Zoom: {Math.round((zoom - 1) * 100)}%
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 sm:max-w-[150px] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium text-sm"
            >
              Crop & Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.src = imageSrc

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Set canvas size to crop size
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      // Draw cropped image
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas to Blob conversion failed'))
          }
        },
        'image/jpeg',
        0.95 // 95% quality
      )
    }

    image.onerror = () => reject(new Error('Failed to load image'))
  })
}
