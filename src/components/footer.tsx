"use client"

import Link from "next/link"
import { MapPin, Mail } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import type { TranslationKey } from "@/lib/i18n/translations"

export function Footer() {
  const { t } = useLanguage()

  const footerLinks: Record<string, { label: TranslationKey; href: string }[]> = {
    [t("footer.colBuyers")]: [
      { label: "footer.howToBuy", href: "/how-to-buy" },
      { label: "footer.shippingPolicy", href: "/shipping" },
      { label: "footer.returnPolicy", href: "/returns" },
      { label: "footer.trackOrder", href: "/account" },
      { label: "footer.loqCoinsProgram", href: "/loqcoins" },
    ],
    [t("footer.colDiscover")]: [
      { label: "footer.indiaMap", href: "/india-map" },
      { label: "footer.bestSellers", href: "/best-sellers" },
      { label: "footer.newArrivals", href: "/new" },
      { label: "footer.craftChroniclesBlog", href: "/blog" },
      { label: "footer.allCategories", href: "/category" },
    ],
    [t("footer.colCompany")]: [
      { label: "footer.aboutLoqmart", href: "/about" },
      { label: "footer.ourMission", href: "/mission" },
      { label: "footer.pressMedia", href: "/press" },
      { label: "footer.careers", href: "/careers" },
      { label: "footer.contactUs", href: "/contact" },
    ],
  }

  const legalLinks: { label: TranslationKey; href: string }[] = [
    { label: "footer.termsOfService", href: "/terms" },
    { label: "footer.privacyPolicy", href: "/privacy" },
    { label: "footer.shippingPolicy", href: "/shipping" },
    { label: "footer.returnRefundPolicy", href: "/returns" },
    { label: "footer.grievanceRedressal", href: "/grievance" },
  ]

  const shoppingNotes = [
    { label: "footer.gstVerifiedSellers" as const, href: "/how-to-buy" },
    { label: "footer.msmeRegistered" as const, href: "/category" },
    { label: "footer.panVerified" as const, href: "/india-map" },
    { label: "footer.razorpaySecured" as const, href: null },
  ]

  return (
    <footer className="w-full bg-[#111827] text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-24 md:pt-14 lg:pb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-9 mb-10 md:mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="text-2xl font-black tracking-wide uppercase text-white block mb-4">
              LoqMart
            </Link>
            <p className="text-white/75 text-sm leading-relaxed mb-6">
              {t("footer.tagline")}
            </p>
            <div className="space-y-2 text-sm text-white/75">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{t("footer.location")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:support@loqmart.in" className="hover:text-white hover:underline">support@loqmart.in</a>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold uppercase text-xs tracking-widest text-white/70 mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white hover:underline underline-offset-2 decoration-[#FACC15] transition-colors"
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Shopping information strip */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white/65 mb-3">{t("footer.trustedVerified")}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {shoppingNotes.map((note) => (
              <div key={note.label} className="min-h-16 rounded-[4px] border border-white/12 bg-white/[0.035] px-3 py-3">
                {note.href ? (
                  <Link href={note.href} className="text-sm font-semibold leading-5 text-white/90 hover:text-[#FACC15] transition-colors">
                    {t(note.label)}
                  </Link>
                ) : (
                  <>
                    <p className="text-sm font-semibold leading-5 text-white/90">{t(note.label)}</p>
                    <p className="mt-1 text-xs leading-4 text-white/65">{t("footer.paymentMethodsNote")}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legal strip */}
        <div className="border-t border-white/12 pt-6 flex flex-col lg:flex-row lg:justify-between items-start gap-5">
            <p className="text-white/65 text-xs">
            &copy; {new Date().getFullYear()} LoqMart. {t("footer.allRightsReserved")}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/65 hover:text-white transition-colors"
              >
                {t(link.label)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
