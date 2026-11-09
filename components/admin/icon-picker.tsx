'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CATEGORY_ICONS, FallbackCategoryIcon } from '@/lib/category-icons'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const POPULAR_ICONS = [
  'Laptop', 'Monitor', 'Computer', 'Smartphone', 'Tablet', 'Keyboard', 'Mouse', 
  'Headphones', 'Speaker', 'Printer', 'Video', 'Camera', 'HardDrive', 'Cpu', 
  'Server', 'Network', 'Wifi', 'Bluetooth', 'Usb', 'Microphone', 'Book',
  'Briefcase', 'Wrench', 'Hammer', 'PenTool', 'Box', 'Package', 'Truck', 'Car', 
  'Bus', 'File', 'FileText', 'Folder', 'Calculator', 'Calendar', 'Clock',
  'Map', 'Compass', 'Lightbulb', 'Zap', 'Shield', 'Lock', 'Key', 'Settings',
  'Layout', 'Grid', 'List', 'Maximize', 'Activity', 'Award', 'Badge', 'Star'
]

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [containerRef])

  const filteredIcons = POPULAR_ICONS.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const CurrentIcon = CATEGORY_ICONS[value] || FallbackCategoryIcon

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <Label>Ikon Kategori *</Label>
      <div 
        className="flex items-center gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary-600 focus-within:border-transparent transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-md">
          {value ? <CurrentIcon className="w-5 h-5" /> : <span className="text-xl">{value}</span>}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {value || 'Pilih Ikon...'}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full md:w-80 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <Input 
              autoFocus
              className="pl-9 h-9" 
              placeholder="Cari ikon..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1 pb-1">
            {filteredIcons.length > 0 ? filteredIcons.map((iconName) => {
              const IconComp = CATEGORY_ICONS[iconName]
              if (!IconComp) return null
              return (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(iconName)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                    value === iconName 
                      ? 'bg-primary-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </button>
              )
            }) : (
              <div className="col-span-6 text-center py-4 text-sm text-gray-500">
                Ikon tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
