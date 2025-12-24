import { getAllItems } from '@/lib/actions/item-management-actions'
import { getCategories } from '@/lib/actions/item-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ItemsTable } from '@/components/admin/items-table'
import { ItemFilters } from '@/components/admin/item-filters'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface ItemsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
  }>
}

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const params = await searchParams
  const items = await getAllItems({
    search: params.search,
    categoryId: params.category,
  })
  const categories = await getCategories()

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
            Tambah Barang
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <ItemFilters categories={categories} />

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Barang</CardTitle>
          <CardDescription>
            Menampilkan {items.length} barang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemsTable items={items} />
        </CardContent>
      </Card>
    </div>
  )
}
