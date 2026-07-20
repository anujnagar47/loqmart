"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, ShoppingCart, User } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useCartStore } from "@/lib/store"

function MobileBottomNav() {
  const pathname = usePathname()
  const cartItems = useCartStore((s) => s.items)
  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0)

  const tabs = [
    { href: "/",        icon: Home,         label: "Home"    },
    { href: "/category", icon: Search,       label: "Browse"  },
    { href: "/cart",    icon: ShoppingCart,  label: "Cart"    },
    { href: "/account", icon: User,          label: "Account" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ background: "#fff", borderTop: "1px solid rgba(26,28,28,0.10)", boxShadow: "0 -2px 16px rgba(26,28,28,0.07)" }}>
      <div className="flex items-stretch">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative"
              style={{ color: active ? "#1a1c1c" : "rgba(26,28,28,0.4)" }}>
              <div className="relative">
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.8} />
                {href === "/cart" && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: "#ba1a1a" }}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] font-semibold">{label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background: "#fcd020" }} />
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
  const noLayout =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/seller/dashboard")

  if (noLayout) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="flex-1 pt-16 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  )
}
