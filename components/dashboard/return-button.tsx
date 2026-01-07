'use client'

import { useState } from 'react'
import { declareBorrowReturn } from '@/lib/actions/borrow-actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Redo2 } from 'lucide-react'
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
  compact?: boolean // For table view - shows only icon
}

export function ReturnButton({ requestId, compact = false }: ReturnButtonProps) {
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
          disabled={loading}
          variant="primary"
          size={compact ? "sm" : "md"}
          className={compact ? "h-6 w-12 p-0 px-0" : "w-full sm:w-auto"}
          title={compact ? "Ajukan Pengembalian" : undefined}
        >
          {compact ? (
            <Redo2 className="h-4 w-4" />
          ) : (
            loading ? 'Memproses...' : '🔄 Laporkan Pengembalian'
          )}
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
