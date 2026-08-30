import { Skeleton } from "@/components/ui/skeleton"

export default function InvestorLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-2 md:p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    </div>
  )
}
