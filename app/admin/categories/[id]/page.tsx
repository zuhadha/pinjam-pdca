import { getCategoryById } from '@/lib/actions/item-management-actions'
import { CategoryForm } from '@/components/admin/category-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const category = await getCategoryById(params.id)

  if (!category) {
    notFound()
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Kategori</h1>
        </div>
      </div>

      {/* Form */}
      <CategoryForm mode="edit" initialData={category} />
    </div>
  )
}
