"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface Category {
  id: string
  name: string
  slug: string
  image_url: string
  count: number
  mode: "handmade" | "machine_made"
  icon: string
}

interface Thumb {
  id: string
  images: string[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } }
}

/** One quadrant of a category's 2x2 product-thumbnail collage — falls back
 *  to a blank cell (not a fake image) when that slot has no real product. */
function CollageCell({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <div className="bg-[#ede8e0]" />
  return (
    <div className="relative bg-[#ede8e0]">
      <Image src={src} alt={alt} fill sizes="12vw" className="object-cover" />
    </div>
  )
}

export function CategoryGrid() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [thumbs, setThumbs] = useState<Record<string, Thumb[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          const cats: Category[] = data.categories || []
          setCategories(cats)

          // Real per-category thumbnails for the collage tiles — up to 4
          // actual products per category, not stock art. Best-effort: a
          // category with a failed/empty fetch just falls back to its
          // single image_url in the render below.
          const entries = await Promise.all(
            cats.map(async (c) => {
              try {
                const r = await fetch(`/api/products?category=${c.id}&limit=4`)
                if (!r.ok) return [c.id, []] as const
                const d = await r.json()
                return [c.id, (d.products || []) as Thumb[]] as const
              } catch {
                return [c.id, []] as const
              }
            })
          )
          setThumbs(Object.fromEntries(entries))
        }
      } catch (e) {
        console.error("Failed to fetch categories", e)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-10 md:py-20 px-4 md:px-20 bg-[#f3f3f3]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-[4px] border border-[#1a1c1c]/10 overflow-hidden animate-pulse">
                <div className="aspect-square bg-[#e8e8e8]" />
                <div className="p-3">
                  <div className="h-3 bg-[#e8e8e8] rounded w-2/3 mb-1.5" />
                  <div className="h-2 bg-[#e8e8e8] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-6 md:px-20 bg-[#f3f3f3]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <span className="text-[10px] font-black text-[#725c00] uppercase tracking-[0.3em] block mb-3">
              {t("categoryGrid.eyebrow")}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1c1c] leading-tight">
              {t("categoryGrid.titleLine1")}<br className="hidden md:block" /> {t("categoryGrid.titleLine2")}
            </h2>
            <p className="text-[#4d4632] mt-2 text-sm leading-relaxed">
              {categories.length} {t("categoryGrid.subtitle")}
            </p>
          </div>
          <Link
            href="/category"
            className="group flex items-center gap-2 text-[#725c00] font-bold text-xs uppercase tracking-widest hover:gap-3 transition-all whitespace-nowrap"
          >
            {t("common.viewAll")} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {categories.map((category) => {
            const products = thumbs[category.id] || []

            return (
              <motion.div key={category.slug} variants={itemVariants}>
                <Link
                  href={`/category/${category.slug}`}
                  className="group block bg-white rounded-[4px] border border-[#1a1c1c]/10 overflow-hidden hover:shadow-[0_2px_10px_rgba(26,28,28,0.12)] transition-shadow duration-200"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#ede8e0]">
                    {products.length > 0 ? (
                      <div className="grid grid-cols-2 grid-rows-2 gap-px w-full h-full">
                        {[0, 1, 2, 3].map((i) => (
                          <CollageCell key={i} src={products[i]?.images?.[0]} alt={category.name} />
                        ))}
                      </div>
                    ) : category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant/40"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-[3px] tracking-wider ${
                        category.mode === "handmade"
                          ? "bg-[#fcd020] text-[#1a1c1c]"
                          : "bg-[#1a1c1c] text-white"
                      }`}>
                        {category.mode === "handmade" ? t("categoryGrid.handmade") : t("categoryGrid.machine")}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-[#1a1c1c] text-sm leading-tight group-hover:text-[#725c00] transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-[10px] text-[#4d4632] mt-0.5 font-medium">
                      {(category.count ?? 0).toLocaleString()} {t("categoryGrid.products")}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/india-map">
            <Button type="button" variant="secondary" size="xl">
              {t("categoryGrid.chooseStateOnMap")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
