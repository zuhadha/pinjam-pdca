'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { verifyReturn } from '@/lib/actions/admin-actions'

interface RequestsTableProps {
  requests: any[]
}

export function RequestsTable({ requests }: RequestsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  const handleVerifyReturn = async (requestId: string) =>{
    if (!confirm('Apakah Anda yakin barang sudah dikembalikan dengan baik?')) return

    setActionLoading(requestId)
    const result = await verifyReturn(requestId, adminNotes)
    setActionLoading(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.message || 'Pengembalian berhasil diverifikasi')
      setAdminNotes('')
      setExpandedId(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">📋</div>
        <p>Tidak ada peminjaman ditemukan</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const isExpanded = expandedId === request.id
        const needsVerification = request.return_declared_at && !request.return_verified_at

        return (
          <div
            key={request.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
          >
            {/* Header */}
            <div
              className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
              onClick={() => setExpandedId(isExpanded ? null : request.id)}
            >
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-2">
                   <Badge variant={
                     needsVerification ? 'blue' :
                     request.status === 'pending' ? 'warning' :
                     request.status === 'approved' || request.status === 'borrowed' ? 'success' :
                     request.status === 'rejected' ? 'destructive' :
                     'gray'
                   }>
                     {needsVerification ? '🔄 Verifikasi Return' :
                      request.status === 'pending' ? '⏳ Pending' :
                      request.status === 'approved' ? '✓ Approved' :
                      request.status === 'borrowed' ? '📦 Dipinjam' :
                      request.status === 'rejected' ? '✗ Ditolak' :
                      request.status === 'returned' ? '✓ Dikembalikan' :
                      request.status}
                   </Badge>
                   {request.is_same_day && (
                     <Badge variant="outline">⏰ Sehari</Badge>
                   )}
                 </div>
                 <p className="font-semibold text-gray-900">{request.user?.name} ({request.user?.nik})</p>
                 <p className="text-sm text-gray-600">{request.purpose}</p>
                 <p className="text-xs text-gray-500 mt-1">
                   {request.is_same_day ? (
                     // Same-day: show date with time range
                     `${format(new Date(request.start_datetime), 'dd MMM yyyy, HH:mm')} - ${format(new Date(request.end_datetime), 'HH:mm')}`
                   ) : (
                     // Multi-day: show date range
                     `${format(new Date(request.start_datetime), 'dd MMM yyyy')} - ${format(new Date(request.end_datetime), 'dd MMM yyyy')}`
                   )}
                 </p>
              </div>
              <span className="text-gray-400">
                {isExpanded ? '▼' : '▶'}
              </span>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                {/* Items List */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Barang yang Dipinjam:</h4>
                  <div className="space-y-2">
                    {request.borrow_items?.map((bi: any) => (
                      <div key={bi.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                        <span>{bi.item?.category?.icon || '📦'}</span>
                        <span className="flex-1">{bi.item?.name}</span>
                        <span className="text-sm text-gray-600">Qty: {bi.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                 {request.notes && (
                   <div>
                     <h4 className="font-semibold text-gray-900 mb-1">Catatan User:</h4>
                     <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{request.notes}</p>
                   </div>
                 )}

                 {/* Usage Location */}
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-1">Lokasi Penggunaan:</h4>
                   <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{request.usage_location}</p>
                 </div>

                {request.admin_notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Catatan Admin:</h4>
                    <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">{request.admin_notes}</p>
                  </div>
                )}

                {/* Admin Notes Input (for verification only) */}
                {needsVerification && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan Admin (Opsional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Tambahkan catatan..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent min-h-[80px]"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {needsVerification && (
                    <Button
                      onClick={() => handleVerifyReturn(request.id)}
                      variant="primary"
                      disabled={actionLoading === request.id}
                      className="flex-1"
                    >
                      {actionLoading === request.id ? 'Memproses...' : '✓ Verifikasi Pengembalian'}
                    </Button>
                  )}
                </div>

                {/* Timestamps */}
                <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-100">
                  <p>Dibuat: {format(new Date(request.created_at), 'dd MMM yyyy HH:mm')}</p>
                  {request.approved_at && (
                    <p>Disetujui: {format(new Date(request.approved_at), 'dd MMM yyyy HH:mm')}</p>
                  )}
                  {request.return_declared_at && (
                    <p>Pengembalian Dilaporkan: {format(new Date(request.return_declared_at), 'dd MMM yyyy HH:mm')}</p>
                  )}
                  {request.return_verified_at && (
                    <p>Pengembalian Diverifikasi: {format(new Date(request.return_verified_at), 'dd MMM yyyy HH:mm')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
