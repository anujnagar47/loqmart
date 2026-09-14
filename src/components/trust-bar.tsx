"use client"

import { BadgeCheck, MapPin, Shield, Truck, Star, Award, Package, CreditCard } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export function TrustBar() {
  const { t } = useLanguage()
  const items = [
    { icon: BadgeCheck, text: t("trustBar.gstVerified") },
    { icon: MapPin,     text: t("trustBar.stateTagged") },
    { icon: CreditCard, text: t("trustBar.securePayments") },
    { icon: Shield,     text: t("trustBar.swadeshiRanked") },
    { icon: Truck,      text: t("trustBar.panIndia") },
    { icon: Star,       text: t("trustBar.buyerProtection") },
    { icon: Award,      text: t("trustBar.madeInIndia") },
    { icon: Package,    text: t("trustBar.easyReturns") },
  ]
  const doubled = [...items, ...items]
  return (
    <div className="bg-[#f3f3f3] border-y border-[#eeeeee] py-3 overflow-hidden">
      <div className="flex items-center gap-0 animate-marquee whitespace-nowrap" style={{ willChange: "transform" }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 mx-8 text-sm font-semibold text-[#1a1c1c]/60 shrink-0">
            <item.icon className="w-3.5 h-3.5 text-[#725c00] shrink-0" />
            {item.text}
            <span className="mx-4 text-[#1a1c1c]/20">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
