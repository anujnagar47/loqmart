"use client"

// Skeleton loading components for all async sections
export function ProductCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded overflow-hidden animate-pulse">
      <div className="aspect-[4/5] bg-surface-container" />
      <div className="p-4">
        <div className="h-3 bg-surface-container rounded mb-2 w-3/4" />
        <div className="h-3 bg-surface-container rounded mb-3 w-1/2" />
        <div className="h-4 bg-surface-container rounded w-1/3" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function SellerCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-surface-container rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-surface-container rounded mb-2 w-3/4" />
          <div className="h-3 bg-surface-container rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-surface-container rounded mb-2" />
      <div className="h-3 bg-surface-container rounded w-4/5" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 animate-pulse">
      <div className="h-3 bg-surface-container rounded mb-3 w-1/2" />
      <div className="h-8 bg-surface-container rounded mb-2 w-3/4" />
      <div className="h-3 bg-surface-container rounded w-1/3" />
    </div>
  )
}

export function ReviewSkeleton() {
  return (
    <div className="pb-6 border-b border-surface-container animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-surface-container rounded-full" />
        <div className="flex-1">
          <div className="h-3 bg-surface-container rounded mb-1 w-1/3" />
          <div className="h-3 bg-surface-container rounded w-1/4" />
        </div>
      </div>
      <div className="h-3 bg-surface-container rounded mb-2 w-3/4" />
      <div className="h-3 bg-surface-container rounded w-full" />
    </div>
  )
}

export function BlogCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-surface-container" />
      <div className="p-6">
        <div className="h-3 bg-surface-container rounded mb-3 w-1/3" />
        <div className="h-4 bg-surface-container rounded mb-2 w-full" />
        <div className="h-4 bg-surface-container rounded mb-3 w-4/5" />
        <div className="h-3 bg-surface-container rounded w-1/2" />
      </div>
    </div>
  )
}

export function OrderRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-surface-container animate-pulse">
      <div className="w-12 h-12 bg-surface-container rounded-lg" />
      <div className="flex-1">
        <div className="h-3 bg-surface-container rounded mb-2 w-1/2" />
        <div className="h-3 bg-surface-container rounded w-1/3" />
      </div>
      <div className="h-4 bg-surface-container rounded w-24" />
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 bg-surface-container rounded mb-3 w-24" />
      <div className="h-8 bg-surface-container rounded mb-2 w-1/2" />
      <div className="h-4 bg-surface-container rounded w-2/3" />
    </div>
  )
}
