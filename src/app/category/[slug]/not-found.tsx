import Link from "next/link"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function CategoryNotFound() {
  return (
    <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-[#1a1c1c]/20 mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-[#1a1c1c] mb-2">Category not found</h1>
        <p className="text-[#1a1c1c]/50 mb-6">We couldn&apos;t find the category you are looking for.</p>
        <Link href="/category" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#fcd020] text-[#1a1c1c] font-black rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Browse Categories
        </Link>
      </div>
    </div>
  )
}
