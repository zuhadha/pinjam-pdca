'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageCarouselProps {
  images: Array<{
    id: string
    image_url: string
    display_order: number
  }>
  className?: string
}

export function ImageCarousel({ images, className = '' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-6xl">📦</span>
      </div>
    )
  }

  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1))
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden rounded-lg">
        <img
          src={sortedImages[currentIndex].image_url}
          alt={`Product image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation Arrows (only show if multiple images) */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-full">
              {currentIndex + 1} / {sortedImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Navigation (only show if multiple images) */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToImage(index)
              }}
              className={`
                flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all
                ${index === currentIndex 
                  ? 'border-primary-600 ring-2 ring-primary-600 ring-offset-2' 
                  : 'border-gray-300 hover:border-primary-400 opacity-60 hover:opacity-100'
                }
              `}
            >
              <img
                src={image.image_url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Indicator Dots (alternative, commented out) */}
      {/* {sortedImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {sortedImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToImage(index)
              }}
              className={`
                w-2 h-2 rounded-full transition-all
                ${index === currentIndex 
                  ? 'bg-primary-600 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
                }
              `}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )} */}
    </div>
  )
}
