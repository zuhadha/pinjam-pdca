import { getCategories, getItemById } from '@/lib/actions/item-actions'
import { ItemForm } from '@/components/admin/item-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'

interface EditItemPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { id } = await params
  const [categories, item] = await Promise.all([
    getCategories(),
    getItemById(id)
  ])

  if (!item) {
    redirect('/admin/items')
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/items">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Barang</h1>
          <p className="text-gray-600 mt-2">{item.name}</p>
        </div>
      </div>

      {/* Form */}
      <ItemForm categories={categories} mode="edit" initialData={item} />
    </div>
  )
}
