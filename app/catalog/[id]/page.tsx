import { getItemById } from '@/lib/actions/item-actions'
import { getCurrentUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BorrowButton } from '@/components/borrow/borrow-button'
import { ImageCarousel } from '@/components/catalog/image-carousel'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import { MapPin } from 'lucide-react'

interface ItemDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params
  const [item, user] = await Promise.all([getItemById(id), getCurrentUser()])

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Barang Tidak Ditemukan</h1>
          <Link href="/catalog">
            <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Kembali ke Katalog
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const isAvailable = item.stock_available > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/catalog" className="hover:text-primary-600">Katalog</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{item.name}</span>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Image */}
            <div>
              <ImageCarousel
                images={item.images || []}
                useBlurBackground={true}
              />
            </div>

            {/* Details */}
            <div className="flex flex-col">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {item.category && (
                  <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded font-medium flex items-center gap-1">
                    <span>{item.category.icon}</span>
                    {item.category.name}
                  </span>
                )}
                <span className={`text-sm px-3 py-1 rounded font-medium ${
                  isAvailable 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {isAvailable ? '✓ Tersedia' : '✗ Tidak Tersedia'}
                </span>
              </div>
                  
              <div className="flex flex-col border-b border-slate-300 min-h-42">
                {/* <p>test</p> */}
                {/* Title */}
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{item.name}</h1>
                {/* Description */}
                {item.description && (
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
              <div className='my-3 flex flex-row'>
                <div className='w-full'>
                  <p className='font-semibold text-sm text-slate-400 pb-1'>STOK TOTAL</p>
                  <p className='font-bold'>{item.stock_total} Unit</p>
                </div>
                <div className='w-full'>
                  <p className='font-semibold text-sm text-slate-400 pb-1'>STOK TERSEDIA</p>
                  <p className='font-bold text-green-700'>{item.stock_available} Unit</p>
                </div>
              </div>

              <div className='min-h-24 min-w-24 my-3'>
                <p className='font-semibold text-sm text-slate-400 pb-2'>LOKASI PENYIMPANAN</p>
                <div className='flex flex-row gap-x-2 py-3 px-4 bg-slate-100 border border-slate-200 rounded-xl font-semibold'>
                  <MapPin />
                  <p> {item.location}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                {user ? (
                  <BorrowButton item={item} isAvailable={isAvailable} />
                ) : (
                  <div className="space-y-3">
                    <Link href="/login">
                      <button className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                        Login untuk Meminjam
                      </button>
                    </Link>
                    <p className="text-sm text-red-400 text-center mt-2">
                      Anda harus login terlebih dahulu untuk meminjam barang
                    </p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              {/* {item.is_sensitive && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Barang Sensitif:</strong> Peminjaman barang ini memerlukan persetujuan admin.
                  </p>
                </div>
              )} */}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link href="/catalog">
            <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              ← Kembali ke Katalog
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
