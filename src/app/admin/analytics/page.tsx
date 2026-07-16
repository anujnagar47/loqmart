"use client"

import { useEffect, useState } from "react"
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface AnalyticsData {
  stateDist:      { state: string; count: number }[]
  orderStatusMap: Record<string, number>
  monthlyRevenue: { month: string; revenue: number; orders: number }[]
  monthlySignups: { month: string; count: number }[]
  productSplit:   { handmade: number; machineMade: number }
  sellerFunnel:   { approved: number; pending: number; rejected: number }
  totals: { sellers: number; orders: number; products: number; users: number; revenue: number }
}

const ORDER_COLOR: Record<string, string> = {
  delivered:  "#16a34a",
  processing: "#2563eb",
  pending:    "#d97706",
  cancelled:  "#dc2626",
  shipped:    "#7c3aed",
}

function Sparkbar({ value, max, color = "#fcd020", delay = 0 }: { value: number; max: number; color?: string; delay?: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(max > 0 ? Math.round((value / max) * 100) : 0), delay + 100)
    return () => clearTimeout(t)
  }, [value, max, delay])
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
      <div className="h-full rounded-full" style={{ width: `${width}%`, background: color, transition: `width 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms` }} />
    </div>
  )
}

function KPI({ label, value, trend }: { label: string; value: string | number; trend?: "up" | "down" | "flat" }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor = trend === "up" ? "#16a34a" : trend === "down" ? "#dc2626" : "#94a3b8"
  return (
    <div className="ag-card-stat rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        {trend && <TrendIcon size={14} style={{ color: trendColor }} />}
      </div>
      <p className="text-[24px] font-black text-[#1a1c1c] leading-none tracking-tight">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/35 mt-2">{label}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData]     = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  return (
    <div className="p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 ag-slide-up">
        <div>
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Analytics</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">Real-time platform metrics</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-4 mb-6 ag-slide-up" style={{ animationDelay: "60ms" }}>
        {loading ? [...Array(5)].map((_, i) => <div key={i} className="rounded-2xl h-28 ag-shimmer" />) : data ? [
          { label: "Total Revenue",  value: formatCurrency(data.totals.revenue),   trend: "up"   as const },
          { label: "Orders",         value: data.totals.orders.toLocaleString(),   trend: "up"   as const },
          { label: "Products",       value: data.totals.products.toLocaleString(), trend: "flat" as const },
          { label: "Sellers",        value: data.totals.sellers.toLocaleString(),  trend: "up"   as const },
          { label: "Users",          value: data.totals.users.toLocaleString(),    trend: "up"   as const },
        ].map((k, i) => <KPI key={k.label} {...k} />) : null}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Revenue by month */}
        <div className="ag-card rounded-2xl p-5 ag-slide-up" style={{ animationDelay: "100ms" }}>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1a1c1c]/30 mb-5">Revenue — Last 6 Months</h2>
          {loading ? [...Array(5)].map((_, i) => <div key={i} className="mb-4"><div className="h-2.5 ag-shimmer rounded mb-1" /><div className="h-2 ag-shimmer rounded" /></div>) :
          data?.monthlyRevenue.map((m, i) => {
            const max = Math.max(...(data.monthlyRevenue.map(x => x.revenue)), 1)
            return (
              <div key={m.month} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-[#1a1c1c]/60">{m.month}</span>
                  <div className="text-right">
                    <span className="text-[11px] font-black text-[#1a1c1c]">{formatCurrency(m.revenue)}</span>
                    <span className="text-[10px] text-[#1a1c1c]/30 ml-2">{m.orders} orders</span>
                  </div>
                </div>
                <Sparkbar value={m.revenue} max={max} color="#fcd020" delay={i * 80} />
              </div>
            )
          })}
        </div>

        {/* User signups by month */}
        <div className="ag-card rounded-2xl p-5 ag-slide-up" style={{ animationDelay: "140ms" }}>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1a1c1c]/30 mb-5">User Signups — Last 6 Months</h2>
          {loading ? [...Array(5)].map((_, i) => <div key={i} className="mb-4"><div className="h-2.5 ag-shimmer rounded mb-1" /><div className="h-2 ag-shimmer rounded" /></div>) :
          data?.monthlySignups.map((m, i) => {
            const max = Math.max(...(data.monthlySignups.map(x => x.count)), 1)
            return (
              <div key={m.month} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-[#1a1c1c]/60">{m.month}</span>
                  <span className="text-[11px] font-black text-[#1a1c1c]">{m.count} signups</span>
                </div>
                <Sparkbar value={m.count} max={max} color="#1a1c1c" delay={i * 80} />
              </div>
            )
          })}
        </div>

        {/* State distribution */}
        <div className="ag-card rounded-2xl p-5 ag-slide-up" style={{ animationDelay: "180ms" }}>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1a1c1c]/30 mb-5">Top States by Sellers</h2>
          {loading ? [...Array(6)].map((_, i) => <div key={i} className="mb-4"><div className="h-2.5 ag-shimmer rounded mb-1" /><div className="h-2 ag-shimmer rounded" /></div>) :
          data && data.stateDist.length > 0 ? data.stateDist.slice(0, 8).map((s, i) => {
            const max = Math.max(...data.stateDist.map(x => x.count), 1)
            return (
              <div key={s.state} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#1a1c1c]/70">{s.state || "Unknown"}</span>
                  <span className="text-[11px] font-black text-[#1a1c1c]">{s.count}</span>
                </div>
                <Sparkbar value={s.count} max={max} color="#725c00" delay={i * 60} />
              </div>
            )
          }) : <p className="text-[12px] text-[#1a1c1c]/30 text-center py-6">No sellers registered yet</p>}
        </div>

        {/* Order status breakdown */}
        <div className="ag-card rounded-2xl p-5 ag-slide-up" style={{ animationDelay: "220ms" }}>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1a1c1c]/30 mb-5">Order Status Breakdown</h2>
          {loading ? [...Array(4)].map((_, i) => <div key={i} className="mb-4"><div className="h-2.5 ag-shimmer rounded mb-1" /><div className="h-2 ag-shimmer rounded" /></div>) :
          data && (() => {
            const total = Object.values(data.orderStatusMap).reduce((a, b) => a + b, 0)
            if (total === 0) return <p className="text-[12px] text-[#1a1c1c]/30 text-center py-6">No orders yet</p>
            return Object.entries(data.orderStatusMap).map(([status, count], i) => {
              const pct = Math.round((count / total) * 100)
              return (
                <div key={status} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold capitalize" style={{ color: ORDER_COLOR[status] || "#94a3b8" }}>{status}</span>
                    <span className="text-[11px] font-black text-[#1a1c1c]">{count} <span className="text-[#1a1c1c]/35 font-semibold">({pct}%)</span></span>
                  </div>
                  <Sparkbar value={count} max={total} color={ORDER_COLOR[status] || "#94a3b8"} delay={i * 60} />
                </div>
              )
            })
          })()}
        </div>
      </div>

      {/* Bottom: product composition + seller funnel */}
      <div className="grid grid-cols-2 gap-5">
        <div className="ag-card rounded-2xl p-5 ag-slide-up" style={{ animationDelay: "260ms" }}>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1a1c1c]/30 mb-5">Product Composition</h2>
          {loading ? <div className="h-20 ag-shimmer rounded" /> : data && (() => {
            const total = data.productSplit.handmade + data.productSplit.machineMade
            const hmPct = total > 0 ? Math.round((data.productSplit.handmade  / total) * 100) : 0
            const mmPct = total > 0 ? Math.round((data.productSplit.machineMade / total) * 100) : 0
            return (
              <div className="space-y-4">
                {[
                  { label: "Handmade",     value: data.productSplit.handmade,     pct: hmPct, color: "#059669" },
                  { label: "Machine Made", value: data.productSplit.machineMade,  pct: mmPct, color: "#2563eb" },
                ].map(({ label, value, pct, color }, i) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-[#1a1c1c]/70">{label}</span>
                      <span className="text-[11px] font-black text-[#1a1c1c]">{value} <span className="text-[#1a1c1c]/35">({pct}%)</span></span>
                    </div>
                    <Sparkbar value={value} max={total} color={color} delay={i * 100} />
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        <div className="ag-card rounded-2xl p-5 ag-slide-up" style={{ animationDelay: "300ms" }}>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1a1c1c]/30 mb-5">Seller Approval Funnel</h2>
          {loading ? <div className="h-20 ag-shimmer rounded" /> : data && (() => {
            const total = data.sellerFunnel.approved + data.sellerFunnel.pending + data.sellerFunnel.rejected
            return (
              <div className="space-y-4">
                {([
                  { key: "approved", color: "#16a34a" },
                  { key: "pending",  color: "#d97706" },
                  { key: "rejected", color: "#dc2626" },
                ] as const).map(({ key, color }, i) => {
                  const val = data.sellerFunnel[key]
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[11px] font-bold capitalize" style={{ color }}>{key}</span>
                        <span className="text-[11px] font-black text-[#1a1c1c]">{val} <span className="text-[#1a1c1c]/35">({pct}%)</span></span>
                      </div>
                      <Sparkbar value={val} max={total} color={color} delay={i * 100} />
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
