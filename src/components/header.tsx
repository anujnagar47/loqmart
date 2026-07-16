"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, ShoppingCart, User, Menu, X, LogOut, ChevronDown, MapPin, Package, Wallet } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"

const NAV = [
  { name: "Handmade",     href: "/category?mode=handmade"     },
  { name: "Machine-Made", href: "/category?mode=machine_made" },
  { name: "New",          href: "/new"                        },
  { name: "Best Sellers", href: "/best-sellers"               },
  { name: "States",       href: "/india-map"                  },
]

export function Header() {
  const path   = usePathname()
  const router = useRouter()

  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [userOpen,    setUserOpen]    = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [authUser,  setAuthUser]  = useState<any>(null)
  const [initials,  setInitials]  = useState("")
  const [authReady, setAuthReady] = useState(false)

  const cartItems = useCartStore((state) => state.items)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load auth session once
  useEffect(() => {
    const supabase = createClient()

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setAuthUser(session.user)
        const meta = session.user.user_metadata || {}
        const name = meta.full_name || session.user.email?.split("@")[0] || "U"
        setInitials(name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase())
      }
      setAuthReady(true)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser(session.user)
        const meta = session.user.user_metadata || {}
        const name = meta.full_name || session.user.email?.split("@")[0] || "U"
        setInitials(name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase())
      } else {
        setAuthUser(null)
        setInitials("")
      }
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/category?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  const isActive = (href: string) => {
    if (href === "/category?mode=handmade")    return path === "/category" && !new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("mode")?.includes("machine")
    if (href === "/category?mode=machine_made") return path === "/category" && new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("mode") === "machine_made"
    return path === href
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-[#fcd020] text-[#1a1c1c]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex justify-between items-center px-6 h-16 w-full">
        {/* Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-2xl font-black text-[#1a1c1c] tracking-tighter shrink-0">
            LoqMart
          </Link>
          <nav className="hidden lg:flex gap-7 items-center">
            {NAV.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-semibold transition-all hover:opacity-100",
                  isActive(item.href)
                    ? "opacity-100 border-b-2 border-[#1a1c1c] pb-0.5"
                    : "opacity-60 hover:opacity-80"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center bg-[#1a1c1c]/10 hover:bg-[#1a1c1c]/15 px-4 py-2 rounded-lg transition-colors gap-2">
            <Search className="w-4 h-4 text-[#1a1c1c]/50 shrink-0" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm placeholder-[#1a1c1c]/40 w-44 text-[#1a1c1c] focus:outline-none"
              placeholder="Search catalog…"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Mobile search toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#1a1c1c]/10 transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Cart */}
          <Link href="/cart" className="relative p-2 rounded-lg hover:bg-[#1a1c1c]/10 transition-colors" aria-label="Cart">
            <motion.div whileTap={{ scale: 0.88 }}>
              <ShoppingCart className="w-5 h-5" />
            </motion.div>
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#ba1a1a] text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none pointer-events-none"
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* User - auth-aware */}
          <div className="relative" ref={dropdownRef}>
            {!authReady ? (
              <div className="w-9 h-9 rounded-full bg-[#1a1c1c]/10 animate-pulse" />
            ) : authUser ? (
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-[#1a1c1c]/10 transition-colors"
                aria-label="Account menu"
              >
                <div className="w-8 h-8 bg-[#1a1c1c] rounded-full flex items-center justify-center text-[#fcd020] text-xs font-black shrink-0">
                  {initials}
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform hidden md:block", userOpen && "rotate-180")} />
              </button>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1c1c] text-[#fcd020] rounded-lg text-sm font-bold hover:bg-[#1a1c1c]/90 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* User dropdown */}
            <AnimatePresence>
            {userOpen && authUser && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#1a1c1c]/10 py-1 z-50">
                <div className="px-4 py-3 border-b border-[#1a1c1c]/8">
                  <p className="text-xs font-black text-[#1a1c1c]/50 uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold text-[#1a1c1c] mt-0.5 truncate">{authUser.email}</p>
                </div>
                {[
                  { href: "/account",           icon: User,    label: "My Account"  },
                  { href: "/account?tab=orders", icon: Package, label: "My Orders"   },
                  { href: "/account?tab=coins",  icon: Wallet,  label: "LoqCoins"   },
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
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[#1a1c1c]/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-[#1a1c1c]/10">
          <form onSubmit={handleSearch} className="flex items-center bg-[#1a1c1c]/10 rounded-lg px-3 py-2 gap-2 mt-2">
            <Search className="w-4 h-4 text-[#1a1c1c]/50 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search catalog…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent flex-1 text-sm focus:outline-none placeholder-[#1a1c1c]/40"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4 text-[#1a1c1c]/40" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#fcd020] border-t border-[#1a1c1c]/10">
          <nav className="flex flex-col px-6 py-4 gap-1">
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
                    My Account
                  </Link>
                  <button onClick={() => { handleSignOut(); setMobileOpen(false) }}
                    className="py-2.5 text-sm font-semibold text-red-600 text-left">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-sm font-bold text-[#1a1c1c]">
                  Sign In / Register
                </Link>
              )}
              <Link href="/seller/register" onClick={() => setMobileOpen(false)}
                className="py-2.5 text-sm font-semibold text-[#1a1c1c]/70">
                Become a Seller
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
