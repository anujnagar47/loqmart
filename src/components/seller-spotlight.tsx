"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Star, Award, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/lib/i18n/LanguageContext"

const STATE_NAMES: Record<string, string> = {
  RJ:"Rajasthan", UP:"Uttar Pradesh", MH:"Maharashtra", WB:"West Bengal",
  KA:"Karnataka", TN:"Tamil Nadu", OR:"Odisha", AP:"Andhra Pradesh",
  GJ:"Gujarat", JK:"Jammu & Kashmir", KL:"Kerala", BR:"Bihar",
}

export function SellerSpotlight() {
  const { t } = useLanguage()
  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSellers() {
      const supabase = createClient()
      const { data } = await supabase
        .from("sellers")
        .select("id, business_name, owner_name, state_code, swadeshi_rank, approval_status")
        .eq("approval_status", "approved")
        .order("swadeshi_rank", { ascending: false })
        .limit(4)
      setSellers(data || [])
      setLoading(false)
    }
    fetchSellers()
  }, [])

  return (
    <section className="py-10 md:py-20 px-4 md:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/40 mb-2 block">{t("sellerSpotlight.eyebrow")}</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a1c1c]">{t("sellerSpotlight.title")}</h2>
          </div>
          <Link href="/sellers" className="flex items-center text-[#1a1c1c]/50 font-bold hover:text-[#1a1c1c] transition-colors">
            {t("sellerSpotlight.viewAllSellers")} <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-[#1a1c1c]/30" />
          </div>
        ) : sellers.length === 0 ? (
          <p className="text-center text-[#1a1c1c]/40 py-12 font-medium">{t("sellerSpotlight.loadingSoon")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {sellers.map((seller, i) => {
              const initials = (seller.business_name || "?").split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
              const stateName = STATE_NAMES[seller.state_code] || seller.state_code || "India"
              return (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Link href={`/seller/${seller.id}`}
                    className="group block bg-[#f8f5f0] rounded-[4px] border border-[#1a1c1c]/10 overflow-hidden hover:shadow-[0_2px_10px_rgba(26,28,28,0.12)] transition-shadow duration-200">
                    <div className="relative h-28 bg-gradient-to-br from-[#fcd020] to-[#e6b800]">
                      <div className="absolute -bottom-8 left-5">
                        <div className="w-16 h-16 rounded-full border-4 border-white bg-[#1a1c1c] flex items-center justify-center shadow-lg">
                          <span className="text-[#fcd020] font-black text-lg">{initials}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-12 pb-5 px-5">
                      <div className="flex items-start justify-between mb-1 gap-2">
                        <div>
                          <h3 className="font-extrabold text-[#1a1c1c] text-sm group-hover:text-[#725c00] transition-colors leading-tight">
                            {seller.business_name}
                          </h3>
                          {seller.owner_name && (
                            <p className="text-xs text-[#1a1c1c]/50 mt-0.5">{seller.owner_name}</p>
                          )}
                        </div>
                        {seller.swadeshi_rank > 0 && (
                          <div className="flex items-center gap-1 bg-[#fcd020]/30 px-2 py-1 rounded-full shrink-0">
                            <Award className="w-3 h-3 text-[#725c00]" />
                            <span className="text-[10px] font-black text-[#725c00]">{seller.swadeshi_rank}</span>
                          </div>
                        )}
                      </div>
                      {seller.specialty && (
                        <p className="text-xs text-[#725c00] font-semibold mb-3 mt-1">{seller.specialty}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-[#1a1c1c]/40">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{stateName}
                        </span>
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
