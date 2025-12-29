'use client'

import React, { useRef, useEffect } from 'react'

interface MagicBentoProps {
  children: React.ReactNode
  className?: string
}

export function MagicBento({ children, className = '' }: MagicBentoProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Set CSS variables
      card.style.setProperty('--mouse-x', `${x}px`)
      card.style.setProperty('--mouse-y', `${y}px`)

      // Calculate if mouse is near the card
      const isNear = 
        e.clientX >= rect.left - 150 &&
        e.clientX <= rect.right + 150 &&
        e.clientY >= rect.top - 150 &&
        e.clientY <= rect.bottom + 150

      if (isNear) {
        // Calculate distance for opacity
        let distance = 0
        
        if (e.clientX < rect.left) {
          distance += Math.pow(rect.left - e.clientX, 2)
        } else if (e.clientX > rect.right) {
          distance += Math.pow(e.clientX - rect.right, 2)
        }
        
        if (e.clientY < rect.top) {
          distance += Math.pow(rect.top - e.clientY, 2)
        } else if (e.clientY > rect.bottom) {
          distance += Math.pow(e.clientY - rect.bottom, 2)
        }
        
        distance = Math.sqrt(distance)
        const opacity = Math.max(0, 1 - distance / 150)
        
        card.style.setProperty('--opacity', String(opacity))
      } else {
        card.style.setProperty('--opacity', '0')
      }
    }

    // Add global listener
    document.addEventListener('mousemove', handleGlobalMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
        '--opacity': '0',
        background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(37, 99, 235, 0.6), transparent 40%)`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
