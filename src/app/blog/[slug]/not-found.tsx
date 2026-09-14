import Link from "next/link"
import { BookOpen } from "lucide-react"

export default function BlogPostNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f5f0" }}>
      <div className="text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-[#1a1c1c]/15" />
        <h1 className="text-[22px] font-bold text-[#1a1c1c] mb-2">Story not found</h1>
        <Link href="/blog" className="font-bold hover:underline" style={{ color: "#725c00" }}>
          Back to all stories
        </Link>
      </div>
    </div>
  )
}
