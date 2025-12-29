import { getCategories } from '@/lib/actions/item-actions'
import { ItemForm } from '@/components/admin/item-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function CreateItemPage() {
  const categories = await getCategories()

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/admin/items">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tambah Barang Baru</h1>
          {/* <p className="text-gray-600 mt-2">Tambahkan barang baru ke katalog</p> */}
        </div>
      </div>

      {/* Form */}
      <ItemForm categories={categories} mode="create"/>
    </div>
  )
}
