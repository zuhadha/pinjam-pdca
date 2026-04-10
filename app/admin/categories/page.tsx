import { getCategories } from '@/lib/actions/item-actions'
import { CategoriesManager } from './categories-manager'

export default async function CategoriesPage() {
  const categories = await getCategories()

  return <CategoriesManager initialCategories={categories || []} />
}
