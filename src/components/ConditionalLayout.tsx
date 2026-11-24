"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, ShoppingCart, User } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartSync, CartSyncStatusBanner } from "@/components/cart-sync"
import { useCartStore } from "@/lib/store"
import { InquiryOverlay } from "@/components/inquiry/InquiryOverlay"
import { AnalyticsConsent } from "@/components/analytics-consent"
import { DemandCapture, DemandCaptureStrip } from "@/components/demand/DemandCapture"

function MobileBottomNav() {
  const pathname = usePathname()
  const itemCount = useCartStore((s) => s.getItemCount())

  const tabs = [
    { href: "/",        icon: Home,         label: "Home"    },
    { href: "/category", icon: Search,       label: "Browse"  },
    { href: "/cart",    icon: ShoppingCart,  label: "Cart"    },
    { href: "/account", icon: User,          label: "Account" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ background: "#fff", borderTop: "1px solid rgba(17,24,39,0.10)", boxShadow: "0 -2px 16px rgba(17,24,39,0.07)" }}>
      <div className="flex items-stretch">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative"
              style={{ color: active ? "#111827" : "rgba(17,24,39,0.4)" }}>
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                {href === "/cart" && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: "#ba1a1a" }}>
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] font-semibold">{label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background: "#FACC15" }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicSellerStore = /^\/seller\/[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(pathname || "")
  const noLayout =
    pathname?.startsWith("/admin") ||
    (pathname?.startsWith("/seller") && !isPublicSellerStore)

  if (noLayout) {
    return <>{children}</>
  }

  return (
    <>
      <CartSync />
      <CartSyncStatusBanner />
      <InquiryOverlay />
      <Header />
      <main className="flex-1 pt-14 lg:pt-24 pb-16 lg:pb-0">{children}</main>
      <DemandCaptureStrip />
      <Footer />
      <MobileBottomNav />
      <AnalyticsConsent />
      <DemandCapture showWelcome={pathname === "/"} />
    </>
  )
}
