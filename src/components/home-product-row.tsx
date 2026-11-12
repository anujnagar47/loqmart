"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import type { Product } from "@/types/database"

const PRESETS = {
  bestSellers: { eyebrow: "row.bestSellers.eyebrow", title: "row.bestSellers.title", subtitle: "row.bestSellers.subtitle" },
  deals:       { eyebrow: "row.deals.eyebrow",       title: "row.deals.title",       subtitle: "row.deals.subtitle"       },
  newArrivals: { eyebrow: "row.newArrivals.eyebrow", title: "row.newArrivals.title", subtitle: "row.newArrivals.subtitle" },
} as const

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
      <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-[#111827] rounded-full flex items-center justify-center shadow-md">
        <span className="text-[#FACC15] text-xs font-black">#{index + 1}</span>
      </div>
    )
  }
  return (
    <span className="absolute -top-2 -right-2 z-10 bg-[#FACC15] text-[#111827] text-[10px] font-bold uppercase px-2 py-1 rounded-full shadow-sm">
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
    <section className={`px-4 py-8 sm:px-6 md:py-12 lg:px-8 ${tone === "dark" ? "bg-[#ffffff]" : "bg-white"}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-6 md:mb-7">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#111827]">{resolvedEyebrow}</span>
            <h2 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">{resolvedTitle}</h2>
            {resolvedSubtitle && <p className="mt-1 max-w-md text-sm leading-5 text-[#4B5563]">{resolvedSubtitle}</p>}
          </div>
          <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#4B5563] transition-colors hover:text-[#111827]">
            {resolvedHrefLabel}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product, i) => (
            <div key={product.id} className="relative h-full">
              {badge && <RowBadge kind={badge} index={i} />}
              <ProductCard product={product} cornerBadge={badge} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
