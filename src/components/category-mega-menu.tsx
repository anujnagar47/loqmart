"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryItem {
  id: string
  name: string
  slug: string
  icon: string | null
  mode: "handmade" | "machine_made"
}

export function CategoryMegaMenu({ active, dark = false }: { active: boolean; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  function ensureLoaded() {
    if (loaded) return
    fetch("/api/categories")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.categories) setCategories(d.categories); setLoaded(true) })
      .catch(() => setLoaded(true))
  }

  const handmade = categories.filter(c => c.mode === "handmade")
  const machineMade = categories.filter(c => c.mode === "machine_made")

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); ensureLoaded() }}
        onMouseEnter={ensureLoaded}
        className={cn(
          "flex items-center gap-1 text-sm font-semibold transition-all",
          dark ? "text-white hover:text-white" : "hover:opacity-100",
          dark
            ? (active || open ? "opacity-100" : "opacity-75 hover:opacity-100")
            : (active || open ? "opacity-100" : "opacity-60 hover:opacity-80")
        )}
      >
        Categories
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-[560px] bg-white rounded-[4px] shadow-2xl border border-[#1a1c1c]/10 p-6 z-50"
          >
            {!loaded ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-6 bg-[#f0ede8] rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#725c00] mb-3">Handmade</p>
                  <div className="space-y-1">
                    {handmade.map(c => (
                      <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setOpen(false)}
                        className="block px-2 py-1.5 rounded-lg hover:bg-[#fcd020]/15 transition-colors text-sm text-[#1a1c1c]/75 hover:text-[#1a1c1c] font-medium">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/40 mb-3">Machine-Made</p>
                  <div className="space-y-1">
                    {machineMade.map(c => (
                      <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setOpen(false)}
                        className="block px-2 py-1.5 rounded-lg hover:bg-[#fcd020]/15 transition-colors text-sm text-[#1a1c1c]/75 hover:text-[#1a1c1c] font-medium">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-[#1a1c1c]/8">
              <Link href="/category" onClick={() => setOpen(false)}
                className="text-xs font-black uppercase tracking-wider text-[#725c00] hover:underline">
                Browse All Categories →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
