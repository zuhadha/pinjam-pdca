import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageRange = () => {
    const delta = 1 // Number of pages to show before and after current page
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            range.push(i)
        }
    }

    for (const i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1)
            } else if (i - l !== 1) {
                rangeWithDots.push('...')
            }
        }
        rangeWithDots.push(i)
        l = i
    }

    return rangeWithDots
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
      <p className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
        Menampilkan <span className="font-medium text-gray-900">{startIndex}</span> - <span className="font-medium text-gray-900">{endIndex}</span> dari <span className="font-medium text-gray-900">{totalItems}</span> data
      </p>
      
      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:h-5" />
        </button>

        <div className="flex items-center gap-1">
          {getPageRange().map((page, index) => {
            if (page === '...') {
              return (
                <div key={`dots-${index}`} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              )
            }

            const isPageActive = currentPage === page

            return (
              <button
                key={`page-${page}`}
                onClick={() => onPageChange(page as number)}
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all
                  ${isPageActive 
                    ? 'bg-primary-100 text-primary-700 border border-primary-200 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
                aria-label={`Page ${page}`}
                aria-current={isPageActive ? "page" : undefined}
              >
                {page}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:h-5" />
        </button>
      </div>
    </div>
  )
}
