"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Package } from "lucide-react"
import { LoqIcon } from "@/components/loq-icon"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import type { Seller } from "@/types/database"

type SpotlightSeller = Pick<
  Seller,
  | "id"
  | "business_name"
  | "owner_name"
  | "state_code"
  | "city"
  | "address"
  | "logo_url"
  | "banner_url"
  | "swadeshi_rank"
  | "swadeshi_score"
  | "total_products"
  | "total_orders"
>

const STATE_NAMES: Record<string, string> = {
  RJ: "Rajasthan", UP: "Uttar Pradesh", MH: "Maharashtra", WB: "West Bengal",
  KA: "Karnataka", TN: "Tamil Nadu", OR: "Odisha", AP: "Andhra Pradesh",
  GJ: "Gujarat", JK: "Jammu & Kashmir", KL: "Kerala", BR: "Bihar",
  MP: "Madhya Pradesh", PB: "Punjab", HR: "Haryana", DL: "Delhi",
}

export function SellerSpotlight() {
  const { t } = useLanguage()
  const [sellers, setSellers] = useState<SpotlightSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchSellers() {
      try {
        const response = await fetch("/api/sellers/featured")
        if (!response.ok) throw new Error("Featured sellers are unavailable")
        const data = await response.json() as { sellers?: SpotlightSeller[] }
        if (!cancelled) setSellers(data.sellers || [])
      } catch {
        if (!cancelled) setSellers([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSellers()
    return () => { cancelled = true }
  }, [])

  return (
    <section className="bg-white px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-6 md:mb-8">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#111827]">
              {t("sellerSpotlight.eyebrow")}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
              {t("sellerSpotlight.title")}
            </h2>
          </div>
          <Link href="/sellers" className="inline-flex min-h-10 shrink-0 items-center gap-2 text-sm font-semibold text-[#4B5563] transition-colors hover:text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EAB308]">
            {t("sellerSpotlight.viewAllSellers")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" aria-label="Loading seller profiles">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-56 animate-pulse border border-[#e8e4da] bg-white" />
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <div className="flex flex-col items-start justify-between gap-4 border-y border-[#e8e4da] py-5 sm:flex-row sm:items-center">
            <p className="text-sm text-[#4B5563]">{t("sellerSpotlight.loadingSoon")}</p>
            <Link href="/sellers" className="inline-flex min-h-10 items-center gap-2 border border-[#E5E7EB] px-4 text-sm font-semibold text-[#111827] transition-colors hover:border-[#EAB308] hover:bg-[#FACC15]">
              {t("sellerSpotlight.viewAllSellers")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {sellers.map((seller, index) => {
              const initials = seller.business_name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase()
              const stateName = (seller.state_code && STATE_NAMES[seller.state_code]) || seller.state_code
              const location = [seller.city, stateName].filter(Boolean).join(", ")

              return (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="h-full"
                >
                  <Link
                    href={`/seller/${seller.id}`}
                    className="group flex h-full min-h-[270px] flex-col border border-[#E5E7EB] bg-white transition-colors hover:border-[#EAB308] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EAB308]"
                  >
                    <div className="relative h-28 shrink-0 overflow-hidden border-b border-[#e8e4da] bg-white sm:h-32">
                      {seller.banner_url ? (
                        <Image src={seller.banner_url} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                      ) : seller.logo_url ? (
                        <Image src={seller.logo_url} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-contain p-5" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl font-semibold text-[#111827]" aria-hidden="true">
                          {initials}
                        </div>
                      )}
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 border border-[#E5E7EB] bg-white px-2 py-1 text-[10px] font-semibold text-[#4B5563]">
                        <LoqIcon name="artisan-seal" className="h-4 w-4" /> Top seller {index + 1}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <h3 className="line-clamp-2 text-sm font-bold leading-5 text-[#111827] group-hover:text-[#111827]">
                        {seller.business_name}
                      </h3>
                      {seller.owner_name && <p className="mt-1 truncate text-xs text-[#4B5563]">{seller.owner_name}</p>}
                      {(seller.address || location) && (
                        <p className="mt-3 flex items-start gap-1.5 text-xs leading-4 text-[#4B5563]">
                          <LoqIcon name="origin-pin" className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="line-clamp-2">{[seller.address, location].filter(Boolean).join(", ")}</span>
                        </p>
                      )}
                      <div className="mt-auto flex items-center gap-4 border-t border-[#e8e4da] pt-3 text-xs text-[#4B5563]">
                        <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" />{seller.total_products} products</span>
                        <span className="inline-flex items-center gap-1">{seller.total_orders} orders</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
