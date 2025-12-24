'use client'

import React, { useRef, useState, useEffect } from 'react'

interface MagicBentoProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function MagicBento({ 
  children, 
  className = '', 
  glowColor = 'rgba(59, 130, 246, 0.5)' // blue-500 by default
}: MagicBentoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        background: isHovered
          ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`
          : 'transparent',
      }}
    >
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  )
}
