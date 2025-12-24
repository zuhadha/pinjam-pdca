'use client'

import { useState } from 'react'
import { declareBorrowReturn } from '@/lib/actions/borrow-actions'
import { Button } from '@/components/ui/button'

interface ReturnButtonProps {
  requestId: string
}

export function ReturnButton({ requestId }: ReturnButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleReturn = async () => {
    if (!confirm('Apakah Anda yakin sudah mengembalikan semua barang dalam peminjaman ini?')) {
      return
    }

    setLoading(true)
    const result = await declareBorrowReturn(requestId)

    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      alert(result.message)
    }
    setLoading(false)
  }

  return (
    <Button
      onClick={handleReturn}
      variant="primary"
      disabled={loading}
      className="w-full sm:w-auto"
    >
      {loading ? 'Memproses...' : 'Laporkan Pengembalian'}
    </Button>
  )
}
