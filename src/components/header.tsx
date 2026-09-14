"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShoppingCart, User, Menu, X, LogOut, ChevronDown, Package, Wallet, Heart, MapPin } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { CategoryMegaMenu } from "@/components/category-mega-menu"
import { SearchBar } from "@/components/search-bar"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Header() {
  const path   = usePathname()
  const router = useRouter()
  const { locale, setLocale, t } = useLanguage()

  const NAV = [
    { name: t("nav.handmade"),     href: "/category?mode=handmade"     },
    { name: t("nav.machineMade"), href: "/category?mode=machine_made" },
    { name: t("nav.new"),          href: "/new"                        },
    { name: t("nav.bestSellers"), href: "/best-sellers"               },
    { name: t("nav.deals"),        href: "/deals"                      },
    { name: t("nav.states"),       href: "/india-map"                  },
  ]

  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [userOpen,    setUserOpen]    = useState(false)

  const [authUser,  setAuthUser]  = useState<SupabaseUser | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const cartItems = useCartStore((state) => state.items)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load auth session once
  useEffect(() => {
    const supabase = createClient()

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) setAuthUser(session.user)
      setAuthReady(true)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setAuthUser(null)
    setUserOpen(false)
    router.push("/")
    router.refresh()
  }

  const isActive = (href: string) => {
    // Query-based nav items (Handmade/Machine-Made) can't be distinguished by
    // pathname alone; avoid reading window/search-params during render since
    // that would mismatch between server and first client render.
    if (href.startsWith("/category?")) return false
    return path === href
  }

  const firstName = authUser?.user_metadata?.full_name?.split(" ")[0] || authUser?.email?.split("@")[0]

  return (
    <header className="fixed top-0 w-full z-50" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Bar 1 — logo, search, account, cart */}
      <div className="bg-[#fcd020] text-[#1a1c1c]">
        <div className="flex items-center h-14 px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3 lg:gap-5">
          <Link href="/" className="text-xl sm:text-2xl font-black tracking-tighter shrink-0">
            LoqMart
          </Link>

          <Link href="/india-map"
            className="hidden md:flex flex-col leading-tight shrink-0 px-2 py-1 rounded-[4px] hover:bg-[#1a1c1c]/8 transition-colors">
            <span className="text-[10px] opacity-60">{t("header.exploreBy")}</span>
            <span className="text-[13px] font-bold flex items-center gap-1"><MapPin className="w-3 h-3" />{t("header.state")}</span>
          </Link>

          <div className="hidden lg:block flex-1 min-w-0">
            <SearchBar variant="desktop" />
          </div>

          <button
            className="lg:hidden ml-auto p-2 rounded-[4px] hover:bg-[#1a1c1c]/10 transition-colors"
            onClick={() => setSearchOpen(o => !o)}
            aria-label="Search"
          >
            <SearchIcon />
          </button>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              className="hidden sm:flex items-center bg-[#1a1c1c]/10 rounded-[4px] p-0.5 text-[11px] font-black shrink-0"
              aria-label={t("header.language")}
            >
              <span className={cn("px-2 py-1 rounded-[3px] transition-colors", locale === "en" ? "bg-white text-[#1a1c1c]" : "text-[#1a1c1c]/50")}>EN</span>
              <span className={cn("px-2 py-1 rounded-[3px] transition-colors", locale === "hi" ? "bg-white text-[#1a1c1c]" : "text-[#1a1c1c]/50")}>हिं</span>
            </button>

            <Link href="/account?tab=wishlist" className="hidden sm:flex p-2 rounded-[4px] hover:bg-[#1a1c1c]/10 transition-colors" aria-label={t("header.wishlist")}>
              <Heart className="w-5 h-5" />
            </Link>

            {/* Account — Amazon-style two-line block */}
            <div className="relative" ref={dropdownRef}>
              {!authReady ? (
                <div className="w-24 h-9 rounded-[4px] bg-[#1a1c1c]/10 animate-pulse" />
              ) : (
                <button
                  onClick={() => authUser ? setUserOpen(o => !o) : router.push("/auth")}
                  className="flex flex-col items-start leading-tight px-2 py-1 rounded-[4px] hover:bg-[#1a1c1c]/10 transition-colors"
                  aria-label={t("header.account")}
                >
                  <span className="text-[10px] opacity-60 hidden sm:block">{t("header.hello")} {authUser ? firstName : t("header.signIn")}</span>
                  <span className="text-[13px] font-bold flex items-center gap-0.5">
                    <User className="w-4 h-4 sm:hidden" />
                    <span className="hidden sm:inline">{t("header.account")}</span>
                    <ChevronDown className={cn("w-3 h-3 transition-transform hidden sm:block", userOpen && "rotate-180")} />
                  </span>
                </button>
              )}

              <AnimatePresence>
                {userOpen && authUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[4px] shadow-xl border border-[#1a1c1c]/10 py-1 z-50">
                    <div className="px-4 py-3 border-b border-[#1a1c1c]/8">
                      <p className="text-xs font-black text-[#1a1c1c]/50 uppercase tracking-wider">{t("header.signedInAs")}</p>
                      <p className="text-sm font-bold text-[#1a1c1c] mt-0.5 truncate">{authUser.email}</p>
                    </div>
                    {[
                      { href: "/account",             icon: User,    label: t("header.myAccount") },
                      { href: "/account?tab=orders",  icon: Package, label: t("header.myOrders")  },
                      { href: "/account?tab=wishlist", icon: Heart,  label: t("header.wishlist")   },
                      { href: "/account?tab=coins",   icon: Wallet,  label: t("header.loqCoins")   },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1c1c] hover:bg-[#fcd020]/20 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-[#1a1c1c]/50" />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-[#1a1c1c]/8 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        {t("header.signOut")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/cart" className="relative flex items-center gap-1.5 p-2 rounded-[4px] hover:bg-[#1a1c1c]/10 transition-colors" aria-label={t("header.cart")}>
              <motion.div whileTap={{ scale: 0.88 }} className="relative">
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] px-0.5 bg-[#ba1a1a] text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none pointer-events-none"
                    >
                      {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <span className="text-[13px] font-bold hidden sm:inline">{t("header.cart")}</span>
            </Link>

            <button
              className="lg:hidden p-2 rounded-[4px] hover:bg-[#1a1c1c]/10 transition-colors"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        {searchOpen && (
          <div className="lg:hidden px-3 pb-3">
            <SearchBar variant="mobile" autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Bar 2 — category + nav links, dark, desktop only */}
      <div className="hidden lg:block bg-[#1a1c1c]">
        <div className="flex items-center h-10 px-6 gap-5">
          <CategoryMegaMenu dark active={path === "/category"} />
          {NAV.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-[13px] font-medium text-white transition-opacity",
                isActive(item.href) ? "opacity-100" : "opacity-75 hover:opacity-100"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#fcd020] border-t border-[#1a1c1c]/10">
          <nav className="flex flex-col px-6 py-4 gap-1">
            <Link href="/category" onClick={() => setMobileOpen(false)}
              className="py-2.5 text-sm font-black border-b border-[#1a1c1c]/8">
              {t("header.allCategories")}
            </Link>

            <button
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              className="flex items-center gap-2 py-2.5 text-sm font-semibold text-[#1a1c1c]/70 border-b border-[#1a1c1c]/8"
            >
              <span className={locale === "en" ? "font-black text-[#1a1c1c]" : ""}>EN</span>
              <span>/</span>
              <span className={locale === "hi" ? "font-black text-[#1a1c1c]" : ""}>हिंदी</span>
            </button>
            {NAV.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "py-2.5 text-sm font-semibold border-b border-[#1a1c1c]/8 last:border-0",
                  isActive(item.href) ? "text-[#1a1c1c] font-black" : "text-[#1a1c1c]/70"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-[#1a1c1c]/15 flex flex-col gap-1">
              {authUser ? (
                <>
                  <Link href="/account" onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm font-semibold text-[#1a1c1c]/70">
                    {t("header.myAccount")}
                  </Link>
                  <Link href="/account?tab=wishlist" onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm font-semibold text-[#1a1c1c]/70">
                    {t("header.wishlist")}
                  </Link>
                  <Link href="/account?tab=orders" onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm font-semibold text-[#1a1c1c]/70">
                    {t("header.myOrders")}
                  </Link>
                  <button onClick={() => { handleSignOut(); setMobileOpen(false) }}
                    className="py-2.5 text-sm font-semibold text-red-600 text-left">
                    {t("header.signOut")}
                  </button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-sm font-bold text-[#1a1c1c]">
                  {t("header.signInRegister")}
                </Link>
              )}
              <Link href="/seller/register" onClick={() => setMobileOpen(false)}
                className="py-2.5 text-sm font-semibold text-[#1a1c1c]/70">
                {t("header.becomeSeller")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
