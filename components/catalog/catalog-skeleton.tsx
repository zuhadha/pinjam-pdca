import { Skeleton } from "@/components/ui/skeleton"

export function CatalogSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 mt-14 lg:mt-0">
        
        {/* --- MOBILE ONLY TOP BAR --- */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary-600 px-4 py-3 flex items-center gap-3">
          <div className="relative flex-1 bg-white/20 rounded-md h-9 animate-pulse" />
          <div className="h-6 w-6 rounded bg-white/20 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-white/20 animate-pulse" />
        </div>

        {/* --- DESKTOP HEADER --- */}
        <div className="mb-8 hidden lg:block space-y-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
          {/* <Skeleton className="h-5 w-96 rounded-md" /> */}
        </div>

        {/* --- FILTERS SECTION --- */}
        {/* Mobile Filters (Categories) */}
        <div className="lg:hidden mb-6 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>

        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center gap-3 mb-8 bg-white p-4 rounded-xl border border-gray-200">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 w-48 rounded-lg" />
          <Skeleton className="h-11 w-40 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>

        {/* --- GRID SECTION --- */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
              {/* Image Area */}
              <Skeleton className="aspect-square sm:aspect-video lg:aspect-square w-full" />
              
              {/* Content Area */}
              <div className="p-3 sm:p-4 flex flex-col flex-1 space-y-3">
                {/* Badges */}
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                
                {/* Title */}
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>

                {/* Info (Stock/Location) */}
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>

                {/* Footer / Buttons */}
                <div className="mt-auto pt-2 flex items-center gap-2">
                  <Skeleton className="h-9 sm:h-9 flex-1 rounded-full" />
                  <Skeleton className="h-10 w-10 sm:h-9 sm:w-9 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
