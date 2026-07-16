import { PageHeaderSkeleton, ProductGridSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <PageHeaderSkeleton />
        <div className="mt-12">
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    </div>
  )
}
