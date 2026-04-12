import { getAllItems } from '@/lib/actions/item-management-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ItemsTable } from '@/components/admin/items-table'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ItemsPage() {
  const items = await getAllItems({})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Barang</h1>
          <p className="text-gray-600 mt-2">Kelola katalog barang yang tersedia untuk dipinjam</p>
        </div>
        <Link href="/admin/items/create">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Tambah
          </Button>
        </Link>
      </div>

      {/* Items Table with integrated filters */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Barang</CardTitle>
          <CardDescription>
            Kelola semua barang dengan filter dan pencarian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemsTable items={items} />
        </CardContent>
      </Card>
    </div>
  )
}
