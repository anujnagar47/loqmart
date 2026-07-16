"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, ShoppingCart, User, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCartStore, useUserStore } from "@/lib/store"

const navigation = [
  { name: "Handmade", href: "/category?mode=handmade" },
  { name: "Machine-Made", href: "/category?mode=machine_made" },
  { name: "New", href: "/new" },
  { name: "Best Sellers", href: "/best-sellers" },
  { name: "States", href: "/india-map" },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { mode, setMode } = useUserStore()
  const cartItems = useCartStore((state) => state.items)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="fixed top-0 w-full z-50 bg-primary-container text-on-primary-fixed">
      <div className="flex justify-between items-center px-6 py-4 w-full">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-on-primary-fixed tracking-tighter">
            LoqMart
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-on-primary-fixed/80",
                  pathname === item.href
                    ? "border-b-2 border-on-primary-fixed pb-1"
                    : "text-on-primary-fixed/70"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-white/20 px-3 py-1.5 rounded-lg">
            <Search className="w-4 h-4 mr-2 text-on-primary-fixed/70" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm placeholder-on-primary-fixed/50 w-48 text-on-primary-fixed"
              placeholder="Search products..."
              type="text"
            />
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="w-5 h-5" />
          </button>

          <Link href="/cart" className="relative p-2">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          <Link href="/account" className="p-2">
            <User className="w-5 h-5" />
          </Link>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden px-6 pb-4">
          <Input
            placeholder="Search products..."
            className="bg-white/20 border-0 text-white placeholder:text-white/50"
          />
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-container border-t border-primary-fixed-dim">
          <nav className="flex flex-col p-6 gap-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-on-primary-fixed/80 hover:text-on-primary-fixed"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link href="/seller/register" className="text-sm font-medium text-on-primary-fixed/80 hover:text-on-primary-fixed mt-4 pt-4 border-t border-primary-fixed-dim">
              Become a Seller
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
