"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, BadgeCheck, ClipboardList, LayoutDashboard, Megaphone, Package, Settings2, Sparkles, Store, UserRound } from "lucide-react"
import { LoqIcon, type LoqIconName } from "@/components/loq-icon"

const items = [
  { label: "Overview", section: "overview", icon: LayoutDashboard },
  { label: "My Catalog & Pricing", section: "products", icon: Package, craft: "seller-studio" as LoqIconName },
  { label: "Orders & Inquiries", section: "orders", icon: ClipboardList },
  { label: "Customization Requests", section: "customization", icon: Sparkles },
  { label: "Performance & Insights", section: "analytics", icon: BarChart3 },
  { label: "Advertise & Boost", section: "advertise", icon: Megaphone },
  { label: "Seller Profile & KYC", section: "profile", icon: UserRound, craft: "artisan-seal" as LoqIconName },
]

export function SellerCentralShell({ children, businessName, state, approvalStatus, storefrontPath }: {
  children: React.ReactNode
  businessName: string
  state: string
  approvalStatus: string
  storefrontPath: string
}) {
  const pathname = usePathname()
  return <div className="min-h-screen bg-[#f3f3f3] text-[#1a1c1c] lg:flex">
    <aside className="w-full shrink-0 border-b border-[#d0c6ac] bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="border-b border-[#eeeeee] px-5 py-5">
        <Link href="/seller/dashboard" className="text-lg font-black tracking-tight">Loq<span className="text-[#725c00]">Mart</span></Link>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#4d4632]">Seller Central</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-y-auto">
        {items.map(({ label, section, icon: Icon, craft }) => {
          const href = `/seller/dashboard#${section}`
          const active = section === "overview" && pathname === "/seller/dashboard"
          return <a key={label} href={href} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${active ? "bg-[#fcd020] text-[#231b00]" : "text-[#4d4632] hover:bg-[#f3f3f3]"}`}>
            {craft ? <LoqIcon name={craft} className="h-6 w-6" /> : <Icon size={16} />} <span>{label}</span>
          </a>
        })}
      </nav>
      <div className="hidden border-t border-[#eeeeee] p-4 text-xs text-[#4d4632] lg:mt-auto lg:block">
        <p className="font-bold">{businessName}</p><p className="mt-1">{state || "India"}</p>
        <div className="mt-3 flex items-center gap-1.5"><LoqIcon name="gi-seal" className="h-5 w-5" /> {approvalStatus === "approved" ? "Verified seller" : `Verification ${approvalStatus}`}</div>
        <Link href={storefrontPath} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 font-bold text-[#725c00]"><Store size={14} /> View Live Storefront ↗</Link>
      </div>
    </aside>
    <main className="min-w-0 flex-1 lg:ml-64">{children}</main>
  </div>
}
