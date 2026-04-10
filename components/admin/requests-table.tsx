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
import { verifyReturn, assignUnitsToRequest } from '@/lib/actions/admin-actions'
import { CheckCircle, Tag, PlusCircle, X } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'

interface RequestsTableProps {
  requests: any[]
  isPermanentView?: boolean // Hide Durasi, Status, Aksi for permanent requests
}

export function RequestsTable({ requests, isPermanentView = false }: RequestsTableProps) {
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
  
  const [assignUnitsDialog, setAssignUnitsDialog] = useState<{
    open: boolean
    request: any | null
  }>({
    open: false,
    request: null,
  })
  
  // Track selections for assigning units: borrow_item_id -> selected unit ids
  const [unitSelections, setUnitSelections] = useState<Record<string, string[]>>({})

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

  const handleAssignUnits = async () => {
    if (!assignUnitsDialog.request) return
    
    // Flatten selections into payload
    const payload = []
    for (const borrowItemId in unitSelections) {
      if (unitSelections[borrowItemId].length > 0) {
        payload.push({
          borrowItemId,
          unitIds: unitSelections[borrowItemId]
        })
      }
    }
    
    if (payload.length === 0) {
      toast.error('Silakan pilih unit terlebih dahulu')
      return
    }

    setActionLoading(assignUnitsDialog.request.id)
    const result = await assignUnitsToRequest(assignUnitsDialog.request.id, payload)
    setActionLoading(null)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Kode unit berhasil di-assign')
      setAssignUnitsDialog({ open: false, request: null })
      // Re-fetch should happen since actions call revalidatePath
    }
  }

  const toggleUnitSelection = (borrowItemId: string, unitId: string, maxQuantity: number) => {
    setUnitSelections(prev => {
      const current = prev[borrowItemId] || []
      if (current.includes(unitId)) {
        return { ...prev, [borrowItemId]: current.filter(id => id !== unitId) }
      } else {
        if (current.length >= maxQuantity) {
          toast.warning(`Maksimal unit yang dapat di-assign adalah ${maxQuantity}`)
          return prev
        }
        return { ...prev, [borrowItemId]: [...current, unitId] }
      }
    })
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
        const matchesBorrower = request.borrower_name?.toLowerCase().includes(searchLower)
          || request.borrower_email?.toLowerCase().includes(searchLower)
          || request.borrower_division?.toLowerCase().includes(searchLower)
        const matchesItems = request.borrow_items?.some((bi: any) =>
          bi.item?.name?.toLowerCase().includes(searchLower)
        )
        const matchesPurpose = request.purpose?.toLowerCase().includes(searchLower)

        if (!matchesBorrower && !matchesItems && !matchesPurpose) {
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
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'borrowed':
        return request.is_permanent ? (
          <div></div>
        ) : (
          <Badge variant="success">Dipinjam</Badge>
        )
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>
      case 'returned':
        return <Badge variant="gray">Dikembalikan</Badge>
      default:
        return <Badge variant="gray">{request.status}</Badge>
    }
  }

  const checkNeedsAssignment = (request: any) => {
    return request.borrow_items?.some((bi: any) => {
      const assignedCount = bi.borrow_item_units?.length || 0
      return assignedCount < bi.quantity && bi.item?.units?.length > 0
    }) && request.status === 'borrowed'
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Cari user, barang, atau keperluan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-auto leading-none text-sm sm:max-w-xs"
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
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className='border-gray-200'>
              <TableHead className="w-[120px]">Tanggal</TableHead>
              <TableHead className="w-[180px]">Peminjam</TableHead>
              <TableHead className="w-[180px]">Barang</TableHead>
              <TableHead className="w-[160px]">Keperluan</TableHead>
              {!isPermanentView && <TableHead className="w-[140px]">Durasi</TableHead>}
              {!isPermanentView && <TableHead className="w-[160px]">Status</TableHead>}
              {!isPermanentView && <TableHead className="w-[100px] text-right">Aksi</TableHead>}
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
                        <p className="font-medium text-sm">{request.borrower_name || '-'}</p>
                        <p className="text-xs text-gray-500">{request.borrower_division || '-'}</p>
                        <p className="text-xs text-gray-400">{request.borrower_email || '-'}</p>
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
                    {!isPermanentView && (
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
                    )}
                    {!isPermanentView && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getStatusBadge(request)}
                          {request.is_permanent && (
                            <Badge variant="secondary">Permanent</Badge>
                          )}
                          {!request.return_verified_at && checkNeedsAssignment(request) && (
                            <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600">Assign Kode</Badge>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {!isPermanentView && (
                      <TableCell className="text-right flex justify-end gap-2">
                        {request.status === 'borrowed' && !request.return_verified_at && checkNeedsAssignment(request) && (
                          <Button
                            onClick={() => {
                              setUnitSelections({})
                              setAssignUnitsDialog({ open: true, request })
                            }}
                            variant="outline"
                            size="sm"
                            className="h-8 border-amber-500 text-amber-600 hover:bg-amber-50 px-2"
                            title="Assign Kode Unit"
                          >
                            <Tag className="h-4 w-4 mr-1" /> Assign Unit
                          </Button>
                        )}
                        {request.status === 'borrowed' && !request.return_verified_at && !checkNeedsAssignment(request) && (
                          <Button
                            onClick={() => setConfirmDialog({ open: true, requestId: request.id })}
                            variant="primary"
                            size="sm"
                            disabled={actionLoading === request.id}
                            className="h-8 px-2"
                            title="Verifikasi Pengembalian"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Selesai
                          </Button>
                        )}
                      </TableCell>
                    )}
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

      {/* Assign Units Modal */}
      {assignUnitsDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Assign Kode Unit untuk Peminjaman</h3>
              <button
                onClick={() => !actionLoading && setAssignUnitsDialog({ ...assignUnitsDialog, open: false })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={!!actionLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {assignUnitsDialog.request && assignUnitsDialog.request.borrow_items.map((bi: any) => {
                const assignedCount = bi.borrow_item_units?.length || 0
                const quantityNeeded = bi.quantity
                const missingCount = quantityNeeded - assignedCount
                
                if (missingCount <= 0 || !bi.item?.units || bi.item.units.length === 0) return null

                return (
                  <div key={bi.id} className="mb-6 border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{bi.item.name}</h4>
                        <p className="text-sm text-gray-500">Butuh {quantityNeeded} unit (Kurang {missingCount} assign)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-gray-500">Pilih Unit Tersedia:</p>
                      <div className="flex flex-wrap gap-2">
                        {bi.item.units.filter((u:any) => u.is_available).length === 0 && (
                          <p className="text-sm text-red-500">Tidak ada unit tersedia. Tambahkan unit di master barang dahulu.</p>
                        )}
                        {bi.item.units.filter((u:any) => u.is_available).map((unit: any) => {
                          const isSelected = (unitSelections[bi.id] || []).includes(unit.id)
                          return (
                            <label 
                              key={unit.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded border text-sm cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-primary-50 border-primary-500 text-primary-700' 
                                  : 'bg-white border-gray-300 hover:border-primary-400'
                              }`}
                            >
                              <input 
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 rounded border-gray-300"
                                checked={isSelected}
                                onChange={() => toggleUnitSelection(bi.id, unit.id, quantityNeeded - assignedCount)}
                              />
                              {unit.code}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="p-4 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignUnitsDialog({ open: false, request: null })} disabled={!!actionLoading}>
                Batal
              </Button>
              <Button onClick={handleAssignUnits} disabled={!!actionLoading} variant="primary">
                {actionLoading ? 'Menyimpan...' : 'Simpan Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
