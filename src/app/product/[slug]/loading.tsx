import { PageHeaderSkeleton, ProductGridSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="aspect-square bg-surface-container rounded-xl animate-pulse" />
          <div className="space-y-6">
            <PageHeaderSkeleton />
            <div className="h-12 bg-surface-container rounded w-full animate-pulse mt-8" />
            <div className="h-12 bg-surface-container rounded w-full animate-pulse mt-4" />
          </div>
        </div>
        <div className="mt-12">
          <div className="h-8 bg-surface-container rounded w-1/3 mb-6 animate-pulse" />
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    </div>
  )
}
