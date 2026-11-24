"use client"

import { usePathname } from "next/navigation"
import { Shield } from "lucide-react"

const labels: Record<string, string> = {
  admin: "Overview", sellers: "Sellers", products: "Products", orders: "Orders", users: "Users",
  analytics: "Analytics", ads: "Sponsored Ads", finance: "Settlements", commission: "Commission",
  returns: "Returns", penalties: "Penalties", reviews: "Reviews", notifications: "Notifications",
  trust: "Trust & Rank", logs: "Audit Logs", categories: "Categories", blog: "Blog", settings: "Settings",
}

export function AdminTopbar() {
  const pathname = usePathname()
  const section = pathname.split("/").filter(Boolean)[1] || "admin"
  return <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#e5e5e5] bg-white/95 px-5 backdrop-blur lg:px-8">
    <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#725c00]">Marketplace operations</p><h1 className="text-sm font-bold text-[#171717]">{labels[section] || "Admin workspace"}</h1></div>
    <div className="flex items-center gap-2 rounded-md bg-[#f3f3f3] px-3 py-1.5 text-[11px] font-semibold text-[#404040]"><Shield size={14} /> Restricted admin workspace</div>
  </header>
}
