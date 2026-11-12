"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ClipboardList, User, Menu, X, LogOut, ChevronDown, Package, Wallet, Heart, MapPin } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useInquiryStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { CategoryMegaMenu } from "@/components/category-mega-menu"
import { SearchBar } from "@/components/search-bar"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { CRAFT_CATEGORIES, craftSearchHref } from "@/lib/craft-taxonomy"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Header() {
  const path   = usePathname()
  const router = useRouter()
  const { locale, setLocale, t } = useLanguage()

  const NAV = [
    { name: t("nav.handmade"),     href: "/category?craft_type=handcrafted" },
    { name: t("nav.machineMade"), href: "/category?craft_type=contemporary" },
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

  const itemCount = useInquiryStore((state) => state.items.length)
  const openInquiry = useInquiryStore((state) => state.openDrawer)

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

  // Keep the page behind the mobile drawer still while its single scroll area
  // remains usable. Restoring the prior value preserves other layout behavior.
  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previousOverflow }
  }, [mobileOpen])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setAuthUser(null)
    setUserOpen(false)
    router.push("/")
    router.refresh()
  }

  const isActive = (href: string) => {
    // Query-based craft-method nav items can't be distinguished by
    // pathname alone; avoid reading window/search-params during render since
    // that would mismatch between server and first client render.
    if (href.startsWith("/category?")) return false
    return path === href
  }

  const firstName = authUser?.user_metadata?.full_name?.split(" ")[0] || authUser?.email?.split("@")[0]

  return (
    <header className="fixed top-0 w-full z-50" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Bar 1 — logo, search, account, inquiry list */}
      <div className="relative bg-[#FACC15] text-[#111827]">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:gap-5 lg:px-6">
          <Link
            href="/"
            aria-label="LoqMart home"
            className="flex h-11 shrink-0 items-center rounded-[4px] bg-white px-2.5 shadow-sm"
          >
            <Image
              src="/loqmart-logo.png"
              alt=""
              width={1700}
              height={500}
              sizes="(max-width: 640px) 124px, 136px"
              className="h-auto w-[124px] sm:w-[136px]"
              priority
            />
          </Link>

          <Link href="/india-map"
            className="hidden md:flex flex-col leading-tight shrink-0 px-2 py-1 rounded-[4px] hover:bg-[#111827]/8 transition-colors">
            <span className="text-[10px] opacity-60">{t("header.exploreBy")}</span>
            <span className="text-[13px] font-bold flex items-center gap-1"><MapPin className="w-3 h-3" />{t("header.state")}</span>
          </Link>

          <div className="hidden lg:block flex-1 min-w-0">
            <SearchBar variant="desktop" />
          </div>

          <button
            className="lg:hidden ml-auto p-2 rounded-[4px] hover:bg-[#111827]/10 transition-colors"
            onClick={() => setSearchOpen(o => !o)}
            aria-label="Search"
          >
            <SearchIcon />
          </button>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              className="hidden sm:flex items-center bg-[#111827]/10 rounded-[4px] p-0.5 text-[11px] font-black shrink-0"
              aria-label={t("header.language")}
            >
              <span className={cn("px-2 py-1 rounded-[3px] transition-colors", locale === "en" ? "bg-white text-[#111827]" : "text-[#111827]/50")}>EN</span>
              <span className={cn("px-2 py-1 rounded-[3px] transition-colors", locale === "hi" ? "bg-white text-[#111827]" : "text-[#111827]/50")}>हिं</span>
            </button>

            <Link href="/account?tab=wishlist" className="hidden sm:flex p-2 rounded-[4px] hover:bg-[#111827]/10 transition-colors" aria-label={t("header.wishlist")}>
              <Heart className="w-5 h-5" />
            </Link>

            {/* Account — Amazon-style two-line block */}
            <div className="relative" ref={dropdownRef}>
              {!authReady ? (
                <div className="w-24 h-9 rounded-[4px] bg-[#111827]/10 animate-pulse" />
              ) : (
                <button
                  onClick={() => authUser ? setUserOpen(o => !o) : router.push("/login")}
                  className="flex flex-col items-start leading-tight px-2 py-1 rounded-[4px] hover:bg-[#111827]/10 transition-colors"
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
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[4px] shadow-xl border border-[#111827]/10 py-1 z-50">
                    <div className="px-4 py-3 border-b border-[#111827]/8">
                      <p className="text-xs font-black text-[#111827]/50 uppercase tracking-wider">{t("header.signedInAs")}</p>
                      <p className="text-sm font-bold text-[#111827] mt-0.5 truncate">{authUser.email}</p>
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
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111827] hover:bg-[#FACC15]/20 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-[#111827]/50" />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-[#111827]/8 mt-1 pt-1">
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

            <button type="button" onClick={openInquiry} className="relative flex items-center gap-1.5 p-2 rounded-[4px] hover:bg-[#111827]/10 transition-colors" aria-label="Open inquiry list">
              <motion.div whileTap={{ scale: 0.88 }} className="relative">
                <ClipboardList className="w-5 h-5" />
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
              <span className="text-[13px] font-bold hidden sm:inline">Inquiry</span>
            </button>

            <button
              className="lg:hidden p-2 rounded-[4px] hover:bg-[#111827]/10 transition-colors"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        {searchOpen && (
          <div className="absolute left-0 right-0 top-full z-50 bg-[#FACC15] px-3 pb-3 shadow-md lg:hidden">
            <SearchBar variant="mobile" autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Bar 2 — category + nav links, dark, desktop only */}
      <div className="hidden lg:block bg-[#111827]">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-5 px-6">
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
        <div className="fixed inset-x-0 top-14 bottom-16 z-40 touch-pan-y overflow-y-auto overscroll-contain border-t border-[#111827]/10 bg-[#FACC15] lg:hidden" style={{ WebkitOverflowScrolling: "touch" }}>
          <nav className="flex min-h-full flex-col gap-1 px-6 py-4">
            <Link href="/category" onClick={() => setMobileOpen(false)}
              className="py-2.5 text-sm font-black border-b border-[#111827]/8">
              {t("header.allCategories")}
            </Link>

            <div className="border-b border-[#111827]/10 py-2">
              <p className="pb-1 text-[10px] font-black uppercase tracking-widest text-[#111827]/50">Shop by craft</p>
              <div>
                {CRAFT_CATEGORIES.map(category => (
                  <details key={category.slug} className="border-b border-[#111827]/10 last:border-0">
                    <summary className="cursor-pointer py-2.5 text-sm font-semibold text-[#111827]">
                      {category.name}
                    </summary>
                    <div className="grid grid-cols-2 gap-x-2 pb-2 pl-2">
                      <Link href={craftSearchHref(category.searchTerms)} onClick={() => setMobileOpen(false)}
                        className="col-span-2 px-2 py-1.5 text-xs font-semibold text-[#111827]">
                        Browse {category.name}
                      </Link>
                      {category.subcategories.map(subcategory => (
                        <Link key={subcategory} href={craftSearchHref(subcategory)} onClick={() => setMobileOpen(false)}
                          className="px-2 py-1.5 text-xs text-[#111827]/70">
                          {subcategory}
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            <button
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              className="flex items-center gap-2 py-2.5 text-sm font-semibold text-[#111827]/70 border-b border-[#111827]/8"
            >
              <span className={locale === "en" ? "font-black text-[#111827]" : ""}>EN</span>
              <span>/</span>
              <span className={locale === "hi" ? "font-black text-[#111827]" : ""}>हिंदी</span>
            </button>
            {NAV.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "py-2.5 text-sm font-semibold border-b border-[#111827]/8 last:border-0",
                  isActive(item.href) ? "text-[#111827] font-black" : "text-[#111827]/70"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-[#111827]/15 flex flex-col gap-1">
              {authUser ? (
                <>
                  <Link href="/account" onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm font-semibold text-[#111827]/70">
                    {t("header.myAccount")}
                  </Link>
                  <Link href="/account?tab=wishlist" onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm font-semibold text-[#111827]/70">
                    {t("header.wishlist")}
                  </Link>
                  <Link href="/account?tab=orders" onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm font-semibold text-[#111827]/70">
                    {t("header.myOrders")}
                  </Link>
                  <button onClick={() => { handleSignOut(); setMobileOpen(false) }}
                    className="py-2.5 text-sm font-semibold text-red-600 text-left">
                    {t("header.signOut")}
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-sm font-bold text-[#111827]">
                  {t("header.signInRegister")}
                </Link>
              )}
              <Link href="/seller/register" onClick={() => setMobileOpen(false)}
                className="py-2.5 text-sm font-semibold text-[#111827]/70">
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
