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
import { CheckCircle, Tag, PlusCircle, X, Eye } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'

interface RequestsTableProps {
  requests: any[]
  isPermanentView?: boolean // Hide Durasi, Status, Aksi for permanent requests
}

export function RequestsTable({ requests, isPermanentView = false }: RequestsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [usageLocationFilter, setUsageLocationFilter] = useState<string>('all')
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
  
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean
    request: any | null
  }>({
    open: false,
    request: null,
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

  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    requests.forEach(req => {
      if (req.usage_location && req.usage_location !== '-') {
        locations.add(req.usage_location)
      }
    })
    return Array.from(locations).sort()
  }, [requests])

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

      // Usage location filter
      if (usageLocationFilter !== 'all') {
        if (request.usage_location !== usageLocationFilter) {
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
  }, [requests, statusFilter, usageLocationFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRequests, currentPage])

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [statusFilter, usageLocationFilter, searchQuery])

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
        <Select value={usageLocationFilter} onValueChange={setUsageLocationFilter}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder="Filter Lokasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Lokasi</SelectItem>
            {uniqueLocations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
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
              {/* <TableHead className="w-[160px]">Keperluan</TableHead> */}
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
                        <p className="font-medium text-sm">{request.borrower_name || '-'}<span className="text-xs text-gray-500"> - {request.borrower_division || '-'}</span></p>
                        
                        {/* <p className="text-xs text-gray-400">{request.borrower_email || '-'}</p> */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {request.borrow_items?.slice(0, 2).map((bi: any) => (
                          <span key={bi.id} className="text-sm rounded">
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
                    {/* <TableCell className="max-w-[160px] truncate text-sm">
                      {request.purpose}
                    </TableCell> */}
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-3 items-center">
                          <button
                            onClick={() => setDetailsDialog({ open: true, request })}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            title="Detail Peminjaman"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {request.status === 'borrowed' && !request.return_verified_at && checkNeedsAssignment(request) && (
                            <button
                              onClick={() => {
                                setUnitSelections({})
                                setAssignUnitsDialog({ open: true, request })
                              }}
                              className="text-amber-500 hover:text-amber-700 transition-colors p-1"
                              title="Assign Kode Unit"
                            >
                              <Tag className="h-5 w-5" />
                            </button>
                          )}
                          {request.status === 'borrowed' && !request.return_verified_at && !checkNeedsAssignment(request) && (
                            <button
                              onClick={() => setConfirmDialog({ open: true, requestId: request.id })}
                              disabled={actionLoading === request.id}
                              className="text-green-600 hover:text-green-800 transition-colors p-1 disabled:opacity-50"
                              title="Verifikasi Pengembalian"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                        </div>
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
            <div className="flex items-center justify-between p-4">
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
            
            <div className="p-4 flex justify-end gap-3">
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

      {/* Details Modal */}
      {detailsDialog.open && detailsDialog.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4">
              <div className='flex gap-4 items-end'>
                <h3 className="text-lg font-semibold text-gray-900">Detail Peminjaman</h3>
                <div>{getStatusBadge(detailsDialog.request)}</div>
              </div>
              <button
                onClick={() => setDetailsDialog({ open: false, request: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nama Peminjam</p>
                  <p className="font-medium">{detailsDialog.request.borrower_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Divisi</p>
                  <p className="font-medium">{detailsDialog.request.borrower_division || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{detailsDialog.request.borrower_email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Waktu Pengajuan</p>
                  <p className="font-medium">{format(new Date(detailsDialog.request.created_at), 'dd MMM yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Durasi Peminjaman</p>
                  <p className="font-medium">
                    {detailsDialog.request.is_permanent ? (
                      'Permanen'
                    ) : detailsDialog.request.is_same_day ? (
                      `${format(new Date(detailsDialog.request.start_datetime), 'dd MMM yyyy HH:mm')} - ${format(new Date(detailsDialog.request.end_datetime), 'HH:mm')}`
                    ) : (
                      `${format(new Date(detailsDialog.request.start_datetime), 'dd MMM yyyy')} - ${format(new Date(detailsDialog.request.end_datetime), 'dd MMM yyyy')}`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Keperluan</p>
                  <div className='font-medium'>{detailsDialog.request.purpose}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lokasi Penggunaan</p>
                  <p className="font-medium">{detailsDialog.request.usage_location || '-'}</p>
                </div>
              </div>
              

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Daftar Barang</p>
                <div className="bg-gray-100 rounded-md divide-y">
                  {detailsDialog.request.borrow_items?.map((bi: any) => (
                    <div key={bi.id} className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className='flex items-center gap-2'>
                          <p className="font-medium">{bi.item?.name}</p>
                          {bi.borrow_item_units && bi.borrow_item_units.length > 0 ? (
                            <div className="mt-2 text-sm text-gray-600">
                              <div className="flex flex-wrap gap-1">
                                {bi.borrow_item_units.map((biu: any) => (
                                  <Badge key={biu.id} variant="secondary" className="font-mono text-xs">
                                    {biu.item_unit?.code}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : bi.item?.units?.length > 0 ? (
                            <p className="text-xs text-amber-600">Belum ada unit di-assign</p>
                          ) : null}
                        </div>
                        <Badge variant="outline">{bi.quantity} Unit</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {detailsDialog.request.return_declared_at && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mt-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">Informasi Pengembalian</p>
                  <p className="text-xs text-blue-600">Dilaporkan kembali: {format(new Date(detailsDialog.request.return_declared_at), 'dd MMM yyyy HH:mm')}</p>
                  {detailsDialog.request.return_verified_at && (
                    <p className="text-xs text-blue-600">Diverifikasi: {format(new Date(detailsDialog.request.return_verified_at), 'dd MMM yyyy HH:mm')}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 flex justify-end">
              <Button onClick={() => setDetailsDialog({ open: false, request: null })}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
