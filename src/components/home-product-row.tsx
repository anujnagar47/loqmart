"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { ProductCard } from "@/components/product-card"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import type { Product } from "@/types/database"

const PRESETS = {
  bestSellers: { eyebrow: "row.bestSellers.eyebrow", title: "row.bestSellers.title", subtitle: "row.bestSellers.subtitle" },
  deals:       { eyebrow: "row.deals.eyebrow",       title: "row.deals.title",       subtitle: "row.deals.subtitle"       },
  newArrivals: { eyebrow: "row.newArrivals.eyebrow", title: "row.newArrivals.title", subtitle: "row.newArrivals.subtitle" },
} as const

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

interface HomeProductRowProps {
  eyebrow?: string
  title?: React.ReactNode
  subtitle?: string
  href: string
  hrefLabel?: string
  products: Product[]
  tone?: "light" | "dark"
  /** Serializable badge kind — a function prop can't cross the server→client boundary. */
  badge?: "rank" | "new"
  /** Translated eyebrow/title/subtitle for the three homepage rows — overrides the props above. */
  preset?: keyof typeof PRESETS
}

function RowBadge({ kind, index }: { kind: "rank" | "new"; index: number }) {
  if (kind === "rank") {
    return (
      <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-[#1a1c1c] rounded-full flex items-center justify-center shadow-md">
        <span className="text-[#fcd020] text-xs font-black">#{index + 1}</span>
      </div>
    )
  }
  return (
    <span className="absolute -top-2 -right-2 z-10 bg-green-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shadow">
      New
    </span>
  )
}

export function HomeProductRow({
  eyebrow, title, subtitle, href, hrefLabel, products, tone = "light", badge, preset,
}: HomeProductRowProps) {
  const { t } = useLanguage()
  if (products.length === 0) return null

  const resolvedEyebrow  = preset ? t(PRESETS[preset].eyebrow)  : eyebrow
  const resolvedTitle    = preset ? t(PRESETS[preset].title)    : title
  const resolvedSubtitle = preset ? t(PRESETS[preset].subtitle) : subtitle
  const resolvedHrefLabel = hrefLabel ?? t("common.viewAll")

  return (
    <section className={`py-10 md:py-16 px-4 md:px-20 ${tone === "dark" ? "bg-[#f8f5f0]" : ""}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-8 mb-8">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/40 block mb-2">{resolvedEyebrow}</span>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]">{resolvedTitle}</h2>
            {resolvedSubtitle && <p className="text-[#1a1c1c]/50 text-sm mt-2 max-w-md">{resolvedSubtitle}</p>}
          </div>
          <Link href={href} className="flex items-center gap-2 text-[#1a1c1c]/50 font-bold text-sm uppercase tracking-widest hover:text-[#1a1c1c] transition-colors group whitespace-nowrap">
            {resolvedHrefLabel}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 items-stretch"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {products.map((product, i) => (
            <motion.div key={product.id} variants={itemVariants} className="relative h-full">
              {badge && <RowBadge kind={badge} index={i} />}
              <ProductCard product={product} cornerBadge={badge} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
