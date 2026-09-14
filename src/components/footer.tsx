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
    [t("footer.colSellers")]: [
      { label: "footer.sellOnLoqmart", href: "/seller/register" },
      { label: "footer.sellerDashboard", href: "/seller/dashboard" },
      { label: "footer.sellerAgreement", href: "/seller/terms" },
      { label: "footer.commissionStructure", href: "/seller/commission" },
      { label: "footer.swadeshiRank", href: "/seller/swadeshi-rank" },
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
    { label: "footer.sellerAgreement", href: "/seller/terms" },
    { label: "footer.shippingPolicy", href: "/shipping" },
    { label: "footer.returnRefundPolicy", href: "/returns" },
    { label: "footer.grievanceRedressal", href: "/grievance" },
  ]

  return (
    <footer className="w-full bg-[#1a1c1c] text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-black tracking-wide uppercase text-white block mb-4">
              LoqMart
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              {t("footer.tagline")}
            </p>
            <div className="space-y-2 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{t("footer.location")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>support@loqmart.in</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold uppercase text-xs tracking-widest text-white/40 mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white hover:underline underline-offset-2 decoration-[#fcd020] transition-colors"
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* GI certification strip */}
        <div className="border border-white/10 rounded-[4px] p-5 mb-8">
          <div className="flex flex-wrap gap-6 justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">{t("footer.trustedVerified")}</p>
              <div className="flex flex-wrap gap-4 text-sm font-bold text-white">
                <span>&#10003; {t("footer.gstVerifiedSellers")}</span>
                <span>&#10003; {t("footer.msmeRegistered")}</span>
                <span>&#10003; {t("footer.panVerified")}</span>
                <span>&#10003; {t("footer.razorpaySecured")}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/30 uppercase tracking-widest">{t("footer.paymentPartners")}</p>
              <p className="text-white/60 font-bold text-sm mt-1">Razorpay · UPI · IMPS · NEFT</p>
            </div>
          </div>
        </div>

        {/* Legal strip */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-white/30 text-xs">
            &copy; 2024 LoqMart. {t("footer.allRightsReserved")}
          </p>
          <div className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/30 hover:text-white/70 transition-colors"
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
