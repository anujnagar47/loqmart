"use client"

import { useEffect, useState, useRef } from "react"
import { Users, Package, ShoppingCart, IndianRupee, Check, X, AlertCircle, TrendingUp, Zap, Clock, Bell, Shield, ClipboardList } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { MarketplaceIntelligence } from "@/components/admin/MarketplaceIntelligence"
import { RequestedDemandRadar } from "@/components/admin/RequestedDemandRadar"

interface Stats {
  totalSellers: number; pendingSellersCount: number
  totalProducts: number; pendingProductsCount: number
  totalOrders: number; totalRevenue: number
  totalUsers: number
}
interface Log {
  id: string; action: string; target_type: string | null; created_at: string
  users: { full_name: string } | null
}

const ACTION_COLOR: Record<string, { bg: string; dot: string }> = {
  "seller.approve":    { bg: "bg-green-50",  dot: "bg-green-500"  },
  "seller.reject":     { bg: "bg-red-50",    dot: "bg-red-500"    },
  "product.approve":   { bg: "bg-green-50",  dot: "bg-green-500"  },
  "product.reject":    { bg: "bg-red-50",    dot: "bg-red-500"    },
  "penalty.issue":     { bg: "bg-orange-50", dot: "bg-orange-500" },
  "return.update":     { bg: "bg-primary-container/30",   dot: "bg-primary"   },
  "trust.override":    { bg: "bg-purple-50", dot: "bg-purple-500" },
  "commission.update": { bg: "bg-yellow-50", dot: "bg-yellow-500" },
  "settlement.update": { bg: "bg-indigo-50", dot: "bg-indigo-500" },
  "user.delete":       { bg: "bg-red-50",    dot: "bg-red-500"    },
}

function useCounter(target: number, delay = 0) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current || !target) return
    const timer = setTimeout(() => {
      started.current = true
      const duration = 900
      const steps = 45
      const interval = duration / steps
      let step = 0
      const t = setInterval(() => {
        step++
        const progress = step / steps
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.round(eased * target))
        if (step >= steps) { setCount(target); clearInterval(t) }
      }, interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, delay])
  return count
}

function StatCard({ label, rawValue, displayValue, icon: Icon, badge, color = "#FACC15", delay = 0 }: {
  label: string; rawValue: number; displayValue?: string
  icon: React.ElementType; badge?: string | null; color?: string; delay?: number
}) {
  const count = useCounter(rawValue, delay)
  const isCurrency = displayValue?.startsWith("₹") || displayValue?.startsWith("Rs")

  return (
    <div className="ag-card-stat rounded-2xl p-5 ag-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={17} style={{ color }} />
        </div>
        {badge && (
          <span className="text-[9.5px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full ag-dot-pending">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[26px] font-black text-[#111827] leading-none tracking-tight">
        {displayValue
          ? (isCurrency ? formatCurrency(rawValue === 0 ? 0 : rawValue) : displayValue)
          : count.toLocaleString("en-IN")}
      </p>
      <p className="text-[10.5px] text-[#111827]/40 font-semibold mt-1.5 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed top-6 right-6 z-50 ag-toast">
      <div className="flex items-center gap-3 bg-[#111827] text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl" style={{ borderLeft: "3px solid #FACC15" }}>
        <Check size={14} className="text-[#FACC15]" />
        {msg}
      </div>
    </div>
  )
}

export default function AdminOverview() {
  const [stats, setStats]           = useState<Stats | null>(null)
  const [pendingSellers, setPendingSellers] = useState<any[]>([])
  const [pendingProducts, setPendingProducts] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [logs, setLogs]             = useState<Log[]>([])
  const [toast, setToast]           = useState("")
  const [loading, setLoading]       = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/admin/dashboard").then(r => r.json()),
      fetch("/api/admin/logs?limit=12").then(r => r.json()),
    ]).then(([d, l]) => {
      setStats(d.stats)
      setPendingSellers(d.pendingSellers || [])
      setPendingProducts(d.pendingProducts || [])
      setRecentOrders(d.recentOrders || [])
      setLogs(l.logs || [])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const approve = async (type: "sellers" | "products", id: string) => {
    await fetch(`/api/admin/${type}/${id}/approve`, { method: "POST" })
    if (type === "sellers") setPendingSellers(p => p.filter(x => x.id !== id))
    else setPendingProducts(p => p.filter(x => x.id !== id))
    setToast(type === "sellers" ? "Seller approved" : "Product approved")
  }
  const reject = async (type: "sellers" | "products", id: string) => {
    await fetch(`/api/admin/${type}/${id}/reject`, { method: "POST" })
    if (type === "sellers") setPendingSellers(p => p.filter(x => x.id !== id))
    else setPendingProducts(p => p.filter(x => x.id !== id))
    setToast("Rejected")
  }
  const approveAll = async (type: "sellers" | "products") => {
    const items = type === "sellers" ? pendingSellers : pendingProducts
    if (items.length === 0) return
    if (!confirm(`Approve all ${items.length} pending ${type}? This cannot be undone.`)) return
    await Promise.all(items.map(x => fetch(`/api/admin/${type}/${x.id}/approve`, { method: "POST" })))
    if (type === "sellers") setPendingSellers([])
    else setPendingProducts([])
    setToast(`All ${items.length} ${type} approved`)
  }

  const totalPending = (stats?.pendingSellersCount ?? 0) + (stats?.pendingProductsCount ?? 0)
  const alertsExist  = totalPending > 0

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 60000)   return "just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const STATUS_COLORS: Record<string, string> = {
    paid: "bg-green-50 text-green-700", pending: "bg-yellow-50 text-yellow-700",
    failed: "bg-red-50 text-red-600", refunded: "bg-gray-100 text-gray-600",
    delivered: "bg-green-50 text-green-700", processing: "bg-surface-container text-on-surface-variant",
    shipped: "bg-purple-50 text-purple-700", cancelled: "bg-red-50 text-red-600",
  }

  return (
    <div className="p-7 min-h-full">
      {toast && <Toast msg={toast} onDone={() => setToast("")} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-7 ag-slide-up">
        <div>
          <h1 className="text-[22px] font-black text-[#111827] tracking-tight leading-none">Overview</h1>
          <p className="text-[12px] text-[#111827]/40 font-medium mt-1.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {alertsExist && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl ag-slide-up" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <AlertCircle size={14} className="text-red-500 ag-dot-pending" />
            <span className="text-[12px] font-bold text-red-600">{totalPending} items need attention</span>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {loading ? [...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl h-32 ag-shimmer" />
        )) : stats && (
          <>
            <StatCard label="Active Sellers"  rawValue={stats.totalSellers}  icon={Users}        badge={stats.pendingSellersCount  > 0 ? `${stats.pendingSellersCount} pending`  : null} delay={0}   />
            <StatCard label="Live Products"   rawValue={stats.totalProducts} icon={Package}      badge={stats.pendingProductsCount > 0 ? `${stats.pendingProductsCount} pending` : null} delay={80}  />
            <StatCard label="Total Orders"    rawValue={stats.totalOrders}   icon={ShoppingCart} delay={160} />
            <StatCard label="Gross Revenue"   rawValue={stats.totalRevenue}  icon={IndianRupee}  displayValue={formatCurrency(stats.totalRevenue)} color="#16a34a" delay={240} />
          </>
        )}
      </div>

      {/* Quick actions strip */}
      <div className="ag-card rounded-2xl p-4 mb-6 ag-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#111827]/30 mr-1">Quick</span>
          {[
            { label: "All Sellers",     href: "/admin/sellers",    icon: Shield },
            { label: "All Products",    href: "/admin/products",   icon: Package },
            { label: "Finance",         href: "/admin/finance",    icon: IndianRupee },
            { label: "Returns",         href: "/admin/returns",    icon: TrendingUp },
            { label: "Analytics",       href: "/admin/analytics",  icon: Zap },
            { label: "Audit Logs",      href: "/admin/logs",       icon: Clock       },
            { label: "Survey",          href: "/admin/survey",     icon: ClipboardList },
            { label: "Demand Radar",    href: "/admin#demand-radar", icon: Bell },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold ag-btn transition-all"
              style={{ background: "rgba(17,24,39,0.05)", color: "#111827" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FACC15"; (e.currentTarget as HTMLElement).style.color = "#111827" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(17,24,39,0.05)"; (e.currentTarget as HTMLElement).style.color = "#111827" }}
            >
              <Icon size={11} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Approval queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Pending sellers */}
        <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 ag-dot-pending" />
              <h2 className="font-black text-[#111827] text-[13px]">Pending Sellers</h2>
              {pendingSellers.length > 0 && (
                <span className="text-[9.5px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wide">{pendingSellers.length}</span>
              )}
            </div>
            {pendingSellers.length > 1 && (
              <button onClick={() => approveAll("sellers")}
                className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg ag-btn transition-colors"
                style={{ background: "rgba(22,163,74,0.1)", color: "#15803d" }}>
                <Check size={10} /> Approve All
              </button>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
            {loading ? [...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="space-y-1.5"><div className="h-3 w-32 ag-shimmer rounded" /><div className="h-2.5 w-20 ag-shimmer rounded" /></div>
              </div>
            )) : pendingSellers.length > 0 ? pendingSellers.slice(0, 6).map((s, i) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 ag-row-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div>
                  <p className="text-[13px] font-bold text-[#111827]">{s.business_name}</p>
                  <p className="text-[11px] text-[#111827]/40 mt-0.5">{s.owner_name} · {s.state || "India"}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => approve("sellers", s.id)}
                    className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center ag-btn transition-colors">
                    <Check size={13} />
                  </button>
                  <button onClick={() => reject("sellers", s.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center ag-btn transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
                  <Check size={14} className="text-green-600" />
                </div>
                <p className="text-[11px] text-[#111827]/35 font-medium">All clear — no pending sellers</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending products */}
        <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 ag-dot-pending" />
              <h2 className="font-black text-[#111827] text-[13px]">Pending Products</h2>
              {pendingProducts.length > 0 && (
                <span className="text-[9.5px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wide">{pendingProducts.length}</span>
              )}
            </div>
            {pendingProducts.length > 1 && (
              <button onClick={() => approveAll("products")}
                className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg ag-btn transition-colors"
                style={{ background: "rgba(22,163,74,0.1)", color: "#15803d" }}>
                <Check size={10} /> Approve All
              </button>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
            {loading ? [...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-3"><div className="h-3 w-40 ag-shimmer rounded mb-1.5" /><div className="h-2.5 w-24 ag-shimmer rounded" /></div>
            )) : pendingProducts.length > 0 ? pendingProducts.slice(0, 6).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 ag-row-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div>
                  <p className="text-[13px] font-bold text-[#111827] truncate max-w-[200px]">{p.name}</p>
                  <p className="text-[11px] text-[#111827]/40 mt-0.5">{formatCurrency(p.price)} · {p.state_code}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => approve("products", p.id)}
                    className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center ag-btn transition-colors">
                    <Check size={13} />
                  </button>
                  <button onClick={() => reject("products", p.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center ag-btn transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
                  <Check size={14} className="text-green-600" />
                </div>
                <p className="text-[11px] text-[#111827]/35 font-medium">All clear — no pending products</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Orders + Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        {/* Recent orders */}
        <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <h2 className="font-black text-[#111827] text-[13px]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-[10px] font-bold text-[#111827]/35 hover:text-[#111827] transition-colors uppercase tracking-wide">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  {["Order #", "Amount", "Payment", "Status", "Date"].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-[9.5px] font-black uppercase tracking-widest text-[#111827]/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <td colSpan={5} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
                  </tr>
                )) : recentOrders.length > 0 ? recentOrders.map((o, i) => (
                  <tr key={o.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 30}ms` }}>
                    <td className="px-5 py-3 font-bold text-[#111827] text-[12px]">{o.order_number}</td>
                    <td className="px-5 py-3 font-bold text-[12px]">{formatCurrency(o.total)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[o.payment_status] || "bg-gray-100 text-gray-600"}`}>{o.payment_status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[o.order_status] || "bg-gray-100 text-gray-600"}`}>{o.order_status}</span>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-[#111827]/35">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-[11px] text-[#111827]/30">No order activity is available yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed */}
        <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <Bell size={12} className="text-[#111827]/40" />
            <h2 className="font-black text-[#111827] text-[13px]">Activity</h2>
            <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-[#111827]/25">Live</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 ag-dot-pending" />
          </div>
          <div className="divide-y overflow-y-auto ag-scroll" style={{ borderColor: "rgba(0,0,0,0.04)", maxHeight: "380px" }}>
            {loading ? [...Array(6)].map((_, i) => (
              <div key={i} className="px-4 py-3 flex gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full ag-shimmer shrink-0" />
                <div className="flex-1 space-y-1.5"><div className="h-2.5 ag-shimmer rounded" /><div className="h-2 w-16 ag-shimmer rounded" /></div>
              </div>
            )) : logs.length === 0 ? (
              <div className="px-4 py-10 text-center text-[11px] text-[#111827]/30">No activity yet</div>
            ) : logs.map((l, i) => {
              const colors = ACTION_COLOR[l.action] || { bg: "bg-gray-50", dot: "bg-gray-400" }
              return (
                <div key={l.id} className={`px-4 py-3 flex gap-3 ag-row-in ${colors.bg}`} style={{ animationDelay: `${i * 35}ms` }}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#111827] leading-tight">
                      {l.users?.full_name || "System"}
                    </p>
                    <p className="text-[10px] text-[#111827]/45 mt-0.5 font-mono">{l.action}</p>
                    <p className="text-[9.5px] text-[#111827]/28 mt-0.5">{timeAgo(l.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {logs.length > 0 && (
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
              <Link href="/admin/logs" className="text-[10px] font-bold text-[#111827]/35 hover:text-[#111827] transition-colors">
                View full audit log
              </Link>
            </div>
          )}
        </div>
      </div>
      <MarketplaceIntelligence />
      <RequestedDemandRadar />
    </div>
  )
}
