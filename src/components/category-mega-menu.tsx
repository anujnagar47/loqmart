"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { CRAFT_CATEGORIES, craftSearchHref } from "@/lib/craft-taxonomy"

export function CategoryMegaMenu({ active, dark = false }: { active: boolean; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        aria-expanded={open}
        aria-controls="craft-category-menu"
        onClick={() => setOpen(value => !value)}
        className={cn(
          "flex items-center gap-1 text-sm font-semibold transition-all",
          dark ? "text-white hover:text-white" : "hover:opacity-100",
          dark ? (active || open ? "opacity-100" : "opacity-75 hover:opacity-100") : (active || open ? "opacity-100" : "opacity-60 hover:opacity-80")
        )}
      >
        Shop by craft
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="craft-category-menu"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-[min(760px,calc(100vw-32px))] max-h-[72vh] overflow-y-auto bg-white rounded-[4px] shadow-2xl border border-[#111827]/10 p-5 z-50"
          >
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#111827]/45">Crafts and regional traditions</p>
            <div className="grid grid-cols-2 gap-x-6">
              {CRAFT_CATEGORIES.map(category => (
                <details key={category.slug} className="group border-b border-[#111827]/10 py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-2.5 text-sm font-semibold text-[#111827] marker:hidden">
                    <Link href={craftSearchHref(category.searchTerms)} onClick={() => setOpen(false)} className="hover:underline">
                      {category.name}
                    </Link>
                    <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#111827]/40 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pb-2 pl-2">
                    {category.subcategories.map(subcategory => (
                      <Link key={subcategory} href={craftSearchHref(subcategory)} onClick={() => setOpen(false)}
                        className="rounded-sm px-2 py-1.5 text-xs text-[#4B5563] hover:bg-[#FACC15]/20 hover:text-[#111827]">
                        {subcategory}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}
            </div>
            <div className="mt-4 border-t border-[#111827]/10 pt-3">
              <Link href="/category" onClick={() => setOpen(false)} className="text-xs font-bold text-[#111827] hover:underline">
                Browse all products <span aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
