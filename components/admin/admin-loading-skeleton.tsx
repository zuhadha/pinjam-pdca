import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AdminTableSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-10 w-full md:w-[280px] rounded-lg" />
              <Skeleton className="h-10 w-[180px] rounded-lg" />
            </div>
            
            {/* Table Area */}
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 h-10 flex items-center px-4 gap-4 border-b border-gray-100">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24 ml-auto" />
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 flex items-center px-4 gap-4 border-b last:border-0 border-gray-100 bg-white">
                  <Skeleton className="h-4 w-32 rounded" />
                  <div className="w-40 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 opacity-50" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <div className="ml-auto w-24 flex justify-end gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20 mb-2" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row justify-between pb-2">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-9 w-48 mt-2 sm:mt-0" />
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4 flex items-end gap-3 pb-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${Math.random() * 60 + 20}%` }} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-3 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center p-3 rounded-xl border border-gray-100">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="flex justify-center items-center pb-8">
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
