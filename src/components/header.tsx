"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { User, Menu, X, ChevronDown, Package, Wallet, Heart, LocateFixed, Shield, Store, Sparkles } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useInquiryStore, useCartStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { CategoryMegaMenu } from "@/components/category-mega-menu"
import { SearchBar } from "@/components/search-bar"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { CRAFT_CATEGORIES, craftSearchHref } from "@/lib/craft-taxonomy"
import { INDIA_STATE_DATA } from "@/lib/indiaStateData"
import { LoqIcon } from "@/components/loq-icon"
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
  const [locationOpen, setLocationOpen] = useState(false)
  const [deliveryState, setDeliveryState] = useState("India")
  const [pincode, setPincode] = useState("")

  const [authUser,  setAuthUser]  = useState<SupabaseUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [accountRole, setAccountRole] = useState<string | null>(null)

  const inquiryCount = useInquiryStore((state) => state.items.length)
  const cartCount = useCartStore((state) => state.getItemCount())
  const openInquiry = useInquiryStore((state) => state.openDrawer)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load auth session once
  useEffect(() => {
    const supabase = createClient()

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setAuthUser(session.user)
        const { data } = await supabase.from("users").select("role").eq("id", session.user.id).maybeSingle()
        setAccountRole(data?.role || session.user.user_metadata?.role || null)
      }
      setAuthReady(true)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null)
      if (!session?.user) { setAccountRole(null); return }
      const sessionUser = session.user
      void supabase.from("users").select("role").eq("id", sessionUser.id).maybeSingle().then(({ data }) => {
        setAccountRole(data?.role || sessionUser.user_metadata?.role || null)
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const refreshLocation = (event?: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as { stateCode?: string; pincode?: string } : undefined
      try {
        const saved = JSON.parse(localStorage.getItem("loqmart-delivery-location") || "{}")
        const stateName = detail?.stateCode ? INDIA_STATE_DATA.find(state => state.id === detail.stateCode)?.name : null
        if (detail?.stateCode) setDeliveryState(stateName || saved.state || "India")
        else if (saved.state) setDeliveryState(saved.state)
        if (detail?.pincode !== undefined) setPincode(detail.pincode || "")
        else if (saved.pincode) setPincode(saved.pincode)
      } catch { /* optional browser preference */ }
    }
    window.addEventListener("loqmart:location-updated", refreshLocation)
    return () => window.removeEventListener("loqmart:location-updated", refreshLocation)
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("loqmart-delivery-location")
      if (saved) {
        const location = JSON.parse(saved) as { state?: string; pincode?: string }
        if (location.state) setDeliveryState(location.state)
        if (location.pincode) setPincode(location.pincode)
      }
    } catch { /* optional preference */ }
  }, [])

  function saveDeliveryLocation() {
    try { localStorage.setItem("loqmart-delivery-location", JSON.stringify({ state: deliveryState, pincode })) } catch { /* optional preference */ }
    setLocationOpen(false)
  }

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
    setAccountRole(null)
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
  const roleHome = accountRole === "admin" || accountRole === "sub_admin" ? "/admin" : accountRole === "seller" ? "/seller" : "/account"
  const roleLabel = accountRole === "admin" || accountRole === "sub_admin" ? "Open Admin Console" : accountRole === "seller" ? "Seller Central" : null
  const RoleIcon = accountRole === "seller" ? Store : Shield

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
            className="hidden shrink-0 flex-col rounded-[4px] px-2 py-1 leading-tight transition-colors hover:bg-[#111827]/8 md:flex">
            <span className="text-[10px] opacity-60">{t("header.exploreBy")}</span>
            <span className="flex items-center gap-1 text-[13px] font-bold"><LoqIcon name="origin-pin" className="h-4 w-4" />{t("header.state")}</span>
          </Link>

          <div className="relative hidden shrink-0 md:block">
            <button type="button" onClick={() => setLocationOpen(open => !open)} aria-expanded={locationOpen} className="flex flex-col rounded-[4px] px-2 py-1 text-left leading-tight transition-colors hover:bg-[#111827]/8">
              <span className="text-[10px] opacity-60">Deliver to</span>
              <span className="flex items-center gap-1 text-[13px] font-bold"><LoqIcon name="origin-pin" className="h-4 w-4" />{pincode || deliveryState}</span>
            </button>
            {locationOpen && <div className="absolute left-0 top-full z-[60] mt-2 w-72 rounded-md border border-[#d0c6ac] bg-white p-4 text-[#1a1c1c] shadow-xl">
              <p className="text-sm font-bold">Set delivery location</p>
              <label className="mt-3 block text-xs font-semibold">State or region
                <select value={deliveryState} onChange={event => setDeliveryState(event.target.value)} className="mt-1.5 block w-full rounded border border-[#d0c6ac] bg-white px-2.5 py-2 text-sm font-normal">
                  {["India", ...INDIA_STATE_DATA.map(state => state.name)].map(state => <option key={state}>{state}</option>)}
                </select>
              </label>
              <label className="mt-3 block text-xs font-semibold">Pincode
                <input inputMode="numeric" maxLength={6} value={pincode} onChange={event => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit pincode" className="mt-1.5 block w-full rounded border border-[#d0c6ac] px-2.5 py-2 text-sm font-normal" />
              </label>
              <button type="button" onClick={saveDeliveryLocation} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded bg-[#fcd020] px-3 py-2 text-sm font-bold"><LocateFixed className="h-4 w-4" /> Save location</button>
            </div>}
          </div>

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

            <Link href="/wishlist" className="hidden sm:flex p-2 rounded-[4px] hover:bg-[#111827]/10 transition-colors" aria-label={t("header.wishlist")}>
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
                    {roleLabel && <Link href={roleHome} onClick={() => setUserOpen(false)} className="mx-2 my-2 flex items-center gap-2 rounded-md bg-[#0F172A] px-3 py-3 text-sm font-bold text-white hover:bg-[#1e293b]">
                      {accountRole === "seller" ? <LoqIcon name="seller-studio" className="h-6 w-6 text-white" /> : <RoleIcon size={17} />} {roleLabel}
                    </Link>}
                    {(accountRole === "admin" || accountRole === "sub_admin" || accountRole === "seller" ? [
                      { href: roleHome, icon: RoleIcon, label: accountRole === "seller" ? "Seller Central" : "Admin Console" },
                    ] : [
                      { href: "/account", icon: User, label: t("header.myAccount") },
                      { href: "/account?tab=orders", icon: Package, label: t("header.myOrders") },
                      { href: "/wishlist", icon: Heart, label: t("header.wishlist") },
                      { href: "/account?tab=coins", icon: Wallet, label: t("header.loqCoins") },
                    ]).map(({ href, icon: Icon, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111827] hover:bg-[#FACC15]/20 transition-colors"
                      >
                      {accountRole === "seller" && label === "Seller Central"
                        ? <LoqIcon name="seller-studio" className="h-5 w-5" />
                        : accountRole === "admin" || accountRole === "sub_admin"
                          ? <LoqIcon name="precision-compass" className="h-5 w-5" />
                          : <Icon className="w-4 h-4 text-[#111827]/50" />}
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-[#111827]/8 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LoqIcon name="carved-door" className="h-5 w-5" />
                        {t("header.signOut")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/cart" className="relative flex items-center gap-1.5 p-2 rounded-[4px] hover:bg-[#111827]/10 transition-colors" aria-label="Open cart">
              <span className="relative"><LoqIcon name="buyer-basket" className="h-6 w-6" />{cartCount > 0 && <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-black leading-none text-white">{cartCount > 99 ? "99+" : cartCount}</span>}</span>
              <span className="text-[13px] font-bold hidden sm:inline">Cart</span>
            </Link>
            <button type="button" onClick={openInquiry} className="relative flex items-center gap-1.5 p-2 rounded-[4px] hover:bg-[#111827]/10 transition-colors" aria-label="Open inquiry list">
              <motion.div whileTap={{ scale: 0.88 }} className="relative">
                <LoqIcon name="buyer-basket" className="h-6 w-6" />
                <AnimatePresence>
                  {inquiryCount > 0 && (
                    <motion.span
                      key={inquiryCount}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] px-0.5 bg-[#ba1a1a] text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none pointer-events-none"
                    >
                      {inquiryCount > 9 ? "9+" : inquiryCount}
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
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("loqmart:open-welcome"))} className="ml-auto inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-bold text-[#fcd020] hover:bg-white/10"><Sparkles size={13}/>Personalize</button>
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
              <button type="button" onClick={() => { setMobileOpen(false); window.dispatchEvent(new CustomEvent("loqmart:open-welcome")) }} className="flex items-center gap-2 py-2.5 text-sm font-bold text-[#111827]"><Sparkles size={15}/>Personalize</button>
              {authUser ? (
                <>
                  <Link href={roleHome} onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm font-semibold text-[#111827]/70">
                    {accountRole === "admin" || accountRole === "sub_admin" ? "Account · Admin Console" : accountRole === "seller" ? "Account · Seller Central" : t("header.myAccount")}
                  </Link>
                  {roleLabel && <Link href={roleHome} onClick={() => setMobileOpen(false)} className="my-1 flex items-center gap-2 rounded-md bg-[#0F172A] px-3 py-3 text-sm font-bold text-white"><RoleIcon size={16} />{roleLabel}</Link>}
                  {accountRole !== "admin" && accountRole !== "sub_admin" && accountRole !== "seller" && <>
                    <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-semibold text-[#111827]/70">{t("header.wishlist")}</Link>
                    <Link href="/account?tab=orders" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-semibold text-[#111827]/70">{t("header.myOrders")}</Link>
                  </>}
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
