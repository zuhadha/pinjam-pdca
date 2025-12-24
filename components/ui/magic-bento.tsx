'use client'

import React, { useRef, useEffect } from 'react'

interface MagicBentoProps {
  children: React.ReactNode
  className?: string
}

// Global mouse position state
let globalMouseX = 0
let globalMouseY = 0

// Track all card elements
const cards = new Set<HTMLDivElement>()

// Setup global mouse tracking once
if (typeof window !== 'undefined') {
  let isTracking = false
  
  const trackMouse = () => {
    if (isTracking) return
    isTracking = true
    
    document.addEventListener('mousemove', (e) => {
      globalMouseX = e.clientX
      globalMouseY = e.clientY
      
      // Update all cards
      cards.forEach(card => {
        const rect = card.getBoundingClientRect()
        const x = globalMouseX - rect.left
        const y = globalMouseY - rect.top
        
        // Calculate distance from mouse to card
        const distance = Math.sqrt(
          Math.pow(Math.max(0, Math.max(x, rect.width - x)), 2) +
          Math.pow(Math.max(0, Math.max(y, rect.height - y)), 2)
        )
        
        // Show glow if mouse is within 600px radius
        if (distance < 600) {
          card.style.setProperty('--mouse-x', `${x}px`)
          card.style.setProperty('--mouse-y', `${y}px`)
          card.style.setProperty('--opacity', String(Math.max(0, 1 - distance / 600)))
        } else {
          card.style.setProperty('--opacity', '0')
        }
      })
    })
  }
  
  trackMouse()
}

export function MagicBento({ children, className = '' }: MagicBentoProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    // Register card
    cards.add(card)

    return () => {
      // Unregister card on cleanup
      cards.delete(card)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`group relative ${className}`}
      style={{
        background: `
          radial-gradient(
            800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(59, 130, 246, calc(var(--opacity, 0) * 0.15)),
            transparent 40%
          )
        `,
      }}
    >
      {children}
    </div>
  )
}
