'use client'

import { useState } from 'react'
import { declareBorrowReturn } from '@/lib/actions/borrow-actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ReturnButtonProps {
  requestId: string
}

export function ReturnButton({ requestId }: ReturnButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleReturn = async () => {
    setLoading(true)
    const result = await declareBorrowReturn(requestId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.message)
    }
    setLoading(false)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="primary"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Memproses...' : 'Laporkan Pengembalian'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Pengembalian</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin sudah mengembalikan semua barang dalam peminjaman ini?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleReturn}>
            Ya, Sudah Dikembalikan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
