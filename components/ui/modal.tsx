'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** max width class, e.g. 'max-w-lg' */
  width?: string
}

/** Native <dialog> modal: focus trap, Escape and backdrop come from the browser. */
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-lg bg-white p-0 text-gray-900 shadow-xl backdrop:bg-gray-900/40`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
            <h2 className="text-lg font-semibold leading-snug">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="-mr-1 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-gray-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 pb-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}
