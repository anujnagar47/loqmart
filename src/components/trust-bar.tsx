"use client"

import Link from "next/link"
import { LoqIcon, type LoqIconName } from "@/components/loq-icon"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export function TrustBar() {
  const { t } = useLanguage()
  const items = [
    { icon: "craft-threads" as LoqIconName, text: t("trustBar.madeInIndia"), href: "/category" },
    { icon: "origin-pin" as LoqIconName, text: t("trustBar.stateTagged"), href: "/india-map" },
    { icon: "secure-payment" as LoqIconName, text: t("trustBar.securePayments"), href: "/how-to-buy" },
  ]

  return (
    <section aria-label="Shopping information" className="border-y border-[#e8e4da] bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-3">
        {items.map(({ icon, text, href }, index) => (
          <Link
            key={text}
            href={href}
            className={`flex min-h-14 items-center gap-2.5 px-3 py-3 text-xs font-semibold leading-4 text-[#4B5563] sm:px-5 sm:text-sm ${
              index < items.length - 1 ? "sm:border-r sm:border-[#e8e4da]" : ""
            } ${index < items.length - 1 ? "border-b border-[#e8e4da] sm:border-b-0" : ""} transition-colors hover:bg-[#ffffff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#EAB308]`}
          >
          <LoqIcon name={icon} className="h-6 w-6 shrink-0" />
            <span>{text}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
