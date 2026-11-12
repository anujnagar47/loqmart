"use client"

import Link from "next/link"
import { CreditCard, MapPin, Package, Store } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export function TrustBar() {
  const { t } = useLanguage()
  const items = [
    { icon: Package, text: t("trustBar.madeInIndia"), href: "/category" },
    { icon: MapPin, text: t("trustBar.stateTagged"), href: "/india-map" },
    { icon: Store, text: t("trustBar.gstVerified"), href: "/sellers" },
    { icon: CreditCard, text: t("trustBar.securePayments"), href: "/how-to-buy" },
  ]

  return (
    <section aria-label="Shopping information" className="border-y border-[#e8e4da] bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
        {items.map(({ icon: Icon, text, href }, index) => (
          <Link
            key={text}
            href={href}
            className={`flex min-h-14 items-center gap-2.5 px-3 py-3 text-xs font-semibold leading-4 text-[#4B5563] sm:px-5 sm:text-sm ${
              index < items.length - 1 ? "md:border-r md:border-[#e8e4da]" : ""
            } ${index % 2 === 0 ? "border-r border-[#e8e4da] md:border-r" : ""} ${index < 2 ? "border-b border-[#e8e4da] md:border-b-0" : ""} transition-colors hover:bg-[#ffffff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#EAB308]`}
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#111827]" strokeWidth={1.8} />
            <span>{text}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
