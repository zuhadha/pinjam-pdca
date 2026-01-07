'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { verifyReturn } from '@/lib/actions/admin-actions'
import { CheckCircle } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'

interface RequestsTableProps {
  requests: any[]
}

export function RequestsTable({ requests }: RequestsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    requestId: string | null
  }>({
    open: false,
    requestId: null,
  })
  const itemsPerPage = 10

  const handleVerifyReturn = async () => {
    if (!confirmDialog.requestId) return

    setActionLoading(confirmDialog.requestId)
    const result = await verifyReturn(confirmDialog.requestId, adminNotes)
    setActionLoading(null)
    setConfirmDialog({ open: false, requestId: null })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.message || 'Pengembalian berhasil diverifikasi')
      setAdminNotes('')
    }
  }

  // Filter and search logic
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'verification' && (!request.return_declared_at || request.return_verified_at)) {
          return false
        } else if (statusFilter !== 'verification' && request.status !== statusFilter) {
          return false
        }
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesUser = request.user?.name?.toLowerCase().includes(searchLower)
        const matchesItems = request.borrow_items?.some((bi: any) =>
          bi.item?.name?.toLowerCase().includes(searchLower)
        )
        const matchesPurpose = request.purpose?.toLowerCase().includes(searchLower)

        if (!matchesUser && !matchesItems && !matchesPurpose) {
          return false
        }
      }

      return true
    })
  }, [requests, statusFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRequests, currentPage])

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery])

  const getStatusBadge = (request: any) => {
    const needsVerification = !request.is_permanent && request.return_declared_at && !request.return_verified_at

    if (needsVerification) {
      return <Badge variant="blue">🔄 Verifikasi Return</Badge>
    }

    switch (request.status) {
      case 'pending':
        return <Badge variant="warning">⏳ Pending</Badge>
      case 'approved':
        return <Badge variant="success">✓ Approved</Badge>
      case 'borrowed':
        return request.is_permanent ? (
          <Badge variant="default">📦 Taken</Badge>
        ) : (
          <Badge variant="success">📦 Dipinjam</Badge>
        )
      case 'rejected':
        return <Badge variant="destructive">✗ Ditolak</Badge>
      case 'returned':
        return <Badge variant="gray">✓ Dikembalikan</Badge>
      default:
        return <Badge variant="gray">{request.status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Cari user, barang, atau keperluan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="borrowed">Sedang Dipinjam</SelectItem>
            <SelectItem value="verification">Perlu Verifikasi</SelectItem>
            <SelectItem value="returned">Dikembalikan</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className='border-gray-200'>
              <TableHead className="w-[120px]">Tanggal</TableHead>
              <TableHead className="w-[150px]">User</TableHead>
              <TableHead className="w-[180px]">Barang</TableHead>
              <TableHead className="w-[160px]">Keperluan</TableHead>
              <TableHead className="w-[140px]">Durasi</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Tidak ada data yang ditemukan
                </TableCell>
              </TableRow>
            ) : (
              paginatedRequests.map((request) => {
                const needsVerification = !request.is_permanent && request.return_declared_at && !request.return_verified_at
                
                return (
                  <TableRow key={request.id} className="hover:bg-gray-50 border-gray-200">
                    <TableCell className="font-medium">
                      {format(new Date(request.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{request.user?.name}</p>
                        <p className="text-xs text-gray-500">{request.user?.nik}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {request.borrow_items?.slice(0, 2).map((bi: any) => (
                          <span key={bi.id} className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {bi.item?.name} x{bi.quantity}
                          </span>
                        ))}
                        {request.borrow_items?.length > 2 && (
                          <span className="text-sm text-gray-500">
                            +{request.borrow_items.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm">
                      {request.purpose}
                    </TableCell>
                    <TableCell>
                      {request.is_permanent ? (
                        <Badge variant="secondary">Permanent</Badge>
                      ) : request.is_same_day ? (
                        <span className="text-sm">
                          {format(new Date(request.start_datetime), 'HH:mm')} - {format(new Date(request.end_datetime), 'HH:mm')}
                        </span>
                      ) : (
                        <span className="text-sm">
                          {format(new Date(request.start_datetime), 'dd MMM')} - {format(new Date(request.end_datetime), 'dd MMM')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getStatusBadge(request)}
                        {request.is_permanent && (
                          <Badge variant="secondary">Permanent</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {needsVerification && (
                        <Button
                          onClick={() => setConfirmDialog({ open: true, requestId: request.id })}
                          variant="primary"
                          size="sm"
                          disabled={actionLoading === request.id}
                          className="h-6 w-12 p-0"
                          title="Verifikasi Pengembalian"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredRequests.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !actionLoading && setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Verifikasi Pengembalian</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin barang sudah dikembalikan dengan baik dan dalam kondisi yang sesuai?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerifyReturn}
              disabled={!!actionLoading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {actionLoading ? 'Memproses...' : 'Ya, Verifikasi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
