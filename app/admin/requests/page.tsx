import { getAllBorrowRequests } from '@/lib/actions/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestsTable } from '@/components/admin/requests-table'
import { RequestFilters } from '@/components/admin/request-filters'

interface RequestsPageProps {
  searchParams: Promise<{
    status?: string
    search?: string
  }>
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const params = await searchParams
  const requests = await getAllBorrowRequests({
    status: params.status,
    search: params.search,
    isPermanent: false, // Only show borrowing requests (not permanent)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kelola Peminjaman</h1>
        <p className="text-gray-600 mt-2">Kelola permintaan peminjaman dan verifikasi pengembalian barang</p>
      </div>

      {/* Filters */}
      {/* <RequestFilters /> */}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Peminjaman</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestsTable requests={requests} />
        </CardContent>
      </Card>
    </div>
  )
}
