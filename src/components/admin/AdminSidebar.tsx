"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, Package, ShoppingCart, BarChart3, Tag, FileText,
  Shield, MapPin, IndianRupee, Percent, RotateCcw, AlertTriangle, Star, ClipboardList,
  MessageSquare, ChevronRight, Settings, Bell, Eye, Heart, Activity,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import React, { useState, useEffect } from "react"
import { LoqIcon, type LoqIconName } from "@/components/loq-icon"

interface NavItem { href: string; icon: React.ElementType; label: string; exact?: boolean; craft?: LoqIconName }
interface NavGroup { label: string | null; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/admin",            icon: LayoutDashboard, label: "Overview", exact: true },
      { href: "/admin#telemetry", icon: Activity, label: "Live Telemetry" },
      { href: "/admin#product-traffic", icon: Eye, label: "Product Traffic" },
      { href: "/admin#customer-carts", icon: Heart, label: "Carts & Wishlists" },
      { href: "/admin/ads", icon: Tag, label: "Ad & Sponsored Slots" },
      { href: "/admin/sellers", icon: Shield, label: "Seller & Catalog Approvals", craft: "artisan-seal" },
      { href: "/admin/orders", icon: ShoppingCart, label: "Orders & Requests" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/sellers",    icon: Shield,          label: "Sellers", craft: "seller-studio" },
      { href: "/admin/products",   icon: Package,         label: "Products"  },
      { href: "/admin/orders",     icon: ShoppingCart,    label: "Orders"    },
      { href: "/admin/users",      icon: Users,           label: "Users"     },
      { href: "/admin/returns",    icon: RotateCcw,       label: "Returns"   },
      { href: "/admin/penalties",  icon: AlertTriangle,   label: "Penalties" },
      { href: "/admin/reviews",       icon: MessageSquare, label: "Reviews"       },
      { href: "/admin/notifications", icon: Bell,          label: "Notifications" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/finance",    icon: IndianRupee,     label: "Settlements" },
      { href: "/admin/commission", icon: Percent,         label: "Commission"  },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/analytics",  icon: BarChart3,       label: "Analytics"   },
      { href: "/admin/ads",        icon: Tag,             label: "Sponsored Ads" },
      { href: "/admin/trust",      icon: Star,            label: "Trust & Rank" },
      { href: "/admin/logs",       icon: ClipboardList,   label: "Audit Logs"  },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/categories", icon: Tag,             label: "Categories"  },
      { href: "/admin/blog",       icon: FileText,        label: "Blog"        },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings",   icon: Settings,        label: "Settings", craft: "precision-compass" },
    ],
  },
]

interface Props { adminName: string; adminEmail: string; stateScope: string | null }

export function AdminSidebar({ adminName, adminEmail, stateScope }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [mounted, setMounted]     = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const toggleGroup = (label: string) =>
    setCollapsed(c => ({ ...c, [label]: !c[label] }))

  const initials = adminName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <aside
      className="w-56 shrink-0 h-full flex flex-col select-none relative"
      style={{
        background: "linear-gradient(180deg, #151515 0%, #151515 60%, #0C0C0C 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Subtle yellow orb at top */}
      <div
        className="absolute top-0 left-0 w-full h-32 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(250,204,21,0.07) 0%, transparent 70%)" }}
      />

      {/* Logo */}
      <div className="relative px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" className="block group">
          <span className="text-lg font-black tracking-tighter text-white uppercase leading-none">
            Loq<span className="text-[#FACC15]">Mart</span>
          </span>
          <div className="h-[2px] w-0 group-hover:w-full bg-[#FACC15] transition-all duration-300 mt-0.5 rounded-full" />
        </Link>
        <p className="text-[8.5px] font-black uppercase tracking-[0.18em] mt-1.5" style={{ color: "rgba(250,204,21,0.55)" }}>
          {stateScope ? `${stateScope} Sub-Admin` : "Admin Console"}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto scrollbar-none ag-scroll">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-3.5" : ""}>
            {group.label && (
              <button
                onClick={() => toggleGroup(group.label!)}
                className="flex items-center justify-between w-full px-2.5 mb-1 py-0.5 rounded-lg group"
                style={{ transition: "opacity 0.15s" }}
              >
                <span className="text-[8.5px] font-black uppercase tracking-[0.16em]"
                  style={{ color: "rgba(255,255,255,0.22)" }}>
                  {group.label}
                </span>
                <ChevronRight
                  size={9}
                  className="transition-transform duration-200"
                  style={{
                    color: "rgba(255,255,255,0.18)",
                    transform: collapsed[group.label] ? "rotate(0deg)" : "rotate(90deg)",
                  }}
                />
              </button>
            )}

            {!collapsed[group.label!] && (
              <div className="space-y-0.5">
                {group.items.map(({ href, icon: Icon, label, exact, craft }, idx) => {
                  const active = isActive(href, exact)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={[
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold relative overflow-hidden",
                        active ? "" : "ag-slide-up",
                        active ? "" : `ag-d${Math.min(idx * 50, 300)}`,
                        active
                          ? "ag-active-glow text-[#151515] font-black"
                          : "hover:text-white",
                      ].join(" ")}
                      style={
                        active
                          ? {
                              background: "linear-gradient(135deg, #FACC15 0%, #CA8A04 100%)",
                              color: "#151515",
                            }
                          : {
                              color: "rgba(255,255,255,0.45)",
                              transition: "background 0.15s ease, color 0.15s ease",
                            }
                      }
                      onMouseEnter={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"
                          ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)"
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = ""
                          ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"
                        }
                      }}
                    >
                      {craft ? <LoqIcon name={craft} className="h-[18px] w-[18px] shrink-0 text-white" /> : <Icon size={13} className="shrink-0" />}
                      <span>{label}</span>
                      {active && (
                        <span
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#151515]/40"
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="relative px-3 py-3.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.25)" }}
      >
        <div className="flex items-center gap-2.5 px-1 mb-2">
          {/* Avatar with ring for admin */}
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-[#FACC15] flex items-center justify-center text-[#151515] text-[10px] font-black">
              {initials}
            </div>
            {!stateScope && mounted && (
              <span
                className="absolute inset-[-2px] rounded-full border border-[#FACC15]/30 ag-pulse"
                style={{ pointerEvents: "none" }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[11px] font-bold truncate leading-tight">{adminName}</p>
            <p className="text-[9px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              {adminEmail}
            </p>
          </div>
        </div>

        {stateScope && (
          <div className="flex items-center gap-1.5 px-1 mb-2">
            <MapPin size={9} className="text-[#FACC15] shrink-0" />
            <span className="text-[9px] text-[#FACC15] font-bold">{stateScope} scope only</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold ag-btn transition-colors"
          style={{ color: "rgba(255,255,255,0.32)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"
            ;(e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.85)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = ""
            ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.32)"
          }}
        >
          <LoqIcon name="carved-door" className="h-5 w-5 text-white" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
