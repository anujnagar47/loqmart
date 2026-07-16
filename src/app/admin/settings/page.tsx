"use client"

import { useEffect, useState } from "react"
import {
  Settings, RefreshCw, Check, IndianRupee, Database, Package,
  Users, ShoppingCart, BarChart3, Shield, Tag, AlertCircle, Save,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface CommissionConfig { rate: number; gateway_rate: number }
interface PlatformStats {
  sellers: number; approved: number; products: number; handmade: number
  orders: number; revenue: number; users: number; categories: number
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed top-6 right-6 z-50 ag-toast">
      <div className="flex items-center gap-3 bg-[#1a1c1c] text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl" style={{ borderLeft: "3px solid #fcd020" }}>
        <Check size={14} className="text-[#fcd020]" /> {msg}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [commission, setCommission] = useState<CommissionConfig>({ rate: 5, gateway_rate: 2 })
  const [stats, setStats]           = useState<PlatformStats | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState("")
  const [rateEdit, setRateEdit]     = useState(false)
  const [rateForm, setRateForm]     = useState({ rate: "5", gateway_rate: "2" })

  const load = () => {
    setLoading(true)
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      setCommission(d.commission || { rate: 5, gateway_rate: 2 })
      setStats(d.stats || null)
      setRateForm({ rate: String(d.commission?.rate ?? 5), gateway_rate: String(d.commission?.gateway_rate ?? 2) })
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400) }

  const saveRate = async () => {
    setSaving(true)
    const r = await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ global_rate: Number(rateForm.rate), gateway_rate: Number(rateForm.gateway_rate) }),
    })
    if (r.ok) {
      setCommission({ rate: Number(rateForm.rate), gateway_rate: Number(rateForm.gateway_rate) })
      setRateEdit(false)
      showToast("Commission rate updated")
    } else showToast("Failed to save")
    setSaving(false)
  }

  const netToSeller = 100 - commission.rate - commission.gateway_rate

  const STAT_TILES = stats ? [
    { label: "Total Sellers",  value: stats.sellers,   sub: `${stats.approved} approved`, icon: Shield,       color: "#7c3aed" },
    { label: "Products",       value: stats.products,  sub: `${stats.handmade} handmade`, icon: Package,      color: "#0284c7" },
    { label: "Orders",         value: stats.orders,    sub: "all time",                   icon: ShoppingCart, color: "#16a34a" },
    { label: "Gross Revenue",  value: formatCurrency(stats.revenue), sub: "from paid orders", icon: IndianRupee, color: "#fcd020", isText: true },
    { label: "Registered Users", value: stats.users,  sub: "buyers + admins",             icon: Users,        color: "#e11d48" },
    { label: "Categories",     value: stats.categories, sub: "product categories",         icon: Tag,          color: "#d97706" },
  ] : []

  return (
    <div className="p-7 min-h-full">
      {toast && <Toast msg={toast} onDone={() => setToast("")} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-7 ag-slide-up">
        <div>
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Platform Settings</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 font-medium mt-1">Global configuration and platform health</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Platform stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {loading ? [...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl h-24 ag-shimmer" />
        )) : STAT_TILES.map(({ label, value, sub, icon: Icon, color, isText }, i) => (
          <div key={label} className="ag-card-stat rounded-2xl p-4 ag-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <p className="text-[20px] font-black text-[#1a1c1c] leading-none">{isText ? value : Number(value).toLocaleString("en-IN")}</p>
            <p className="text-[10px] font-bold text-[#1a1c1c]/35 mt-1 uppercase tracking-wide">{label}</p>
            <p className="text-[10px] text-[#1a1c1c]/25 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Platform identity */}
      <div className="ag-card rounded-2xl p-5 mb-5 ag-slide-up" style={{ animationDelay: "100ms" }}>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1a1c1c]/30 mb-4">Platform Identity</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Platform Name",   value: "LoqMart"            },
            { label: "Stack",           value: "Next.js 14 + Supabase" },
            { label: "Database",        value: "PostgreSQL (Supabase)" },
            { label: "Authentication",  value: "Supabase Auth"      },
            { label: "Payments",        value: "Razorpay"           },
            { label: "Marketplace",     value: "Swadeshi / Indian"  },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Database size={11} className="text-[#1a1c1c]/20 shrink-0" />
              <div>
                <p className="text-[10px] text-[#1a1c1c]/35 font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-[12px] font-bold text-[#1a1c1c]">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Settings */}
      <div className="ag-card rounded-2xl p-5 mb-5 ag-slide-up" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1a1c1c]/30">Global Commission Rate</h2>
            <p className="text-[11px] text-[#1a1c1c]/40 mt-0.5">Applied to all sellers unless a category or seller override exists</p>
          </div>
          {!rateEdit ? (
            <button onClick={() => setRateEdit(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ag-btn-primary text-[11px] font-black ag-btn">
              <Settings size={11} /> Edit Rate
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveRate} disabled={saving} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ag-btn-primary text-[11px] font-black ag-btn disabled:opacity-60">
                <Save size={11} /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => { setRateEdit(false); setRateForm({ rate: String(commission.rate), gateway_rate: String(commission.gateway_rate) }) }}
                className="px-3.5 py-1.5 rounded-xl text-[11px] font-semibold text-[#1a1c1c]/45 hover:bg-black/5 ag-btn transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>

        {!rateEdit ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ background: "rgba(252,208,32,0.08)", border: "1px solid rgba(252,208,32,0.2)" }}>
              <p className="text-[26px] font-black text-[#1a1c1c] leading-none">{commission.rate}%</p>
              <p className="text-[10px] font-bold text-[#1a1c1c]/40 uppercase tracking-wide mt-1.5">Platform Fee</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(26,28,28,0.04)", border: "1px solid rgba(26,28,28,0.06)" }}>
              <p className="text-[26px] font-black text-[#1a1c1c] leading-none">{commission.gateway_rate}%</p>
              <p className="text-[10px] font-bold text-[#1a1c1c]/40 uppercase tracking-wide mt-1.5">Gateway Fee</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.15)" }}>
              <p className="text-[26px] font-black text-green-700 leading-none">{netToSeller.toFixed(1)}%</p>
              <p className="text-[10px] font-bold text-[#1a1c1c]/40 uppercase tracking-wide mt-1.5">Net to Seller</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Platform Fee %</label>
              <input type="number" min="0" max="50" step="0.5" value={rateForm.rate}
                onChange={e => setRateForm(f => ({ ...f, rate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.8)" }} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Gateway Fee %</label>
              <input type="number" min="0" max="10" step="0.1" value={rateForm.gateway_rate}
                onChange={e => setRateForm(f => ({ ...f, gateway_rate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.8)" }} />
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(252,208,32,0.08)", border: "1px solid rgba(252,208,32,0.2)" }}>
                <AlertCircle size={12} className="text-[#725c00] shrink-0" />
                <p className="text-[11px] text-[#725c00] font-semibold">
                  Net to seller will be {(100 - Number(rateForm.rate) - Number(rateForm.gateway_rate)).toFixed(1)}%. Change is logged to audit trail.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Link href="/admin/commission" className="text-[10px] font-bold text-[#1a1c1c]/35 hover:text-[#1a1c1c] transition-colors">
            View all commission rules
          </Link>
        </div>
      </div>

      {/* Quick links to admin sections */}
      <div className="ag-card rounded-2xl p-5 mb-5 ag-slide-up" style={{ animationDelay: "200ms" }}>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1a1c1c]/30 mb-4">Admin Sections</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Sellers",      href: "/admin/sellers",    icon: Shield,       desc: "Approve + manage" },
            { label: "Products",     href: "/admin/products",   icon: Package,      desc: "Review + moderate" },
            { label: "Orders",       href: "/admin/orders",     icon: ShoppingCart, desc: "Track + update" },
            { label: "Finance",      href: "/admin/finance",    icon: IndianRupee,  desc: "Settlements + GMV" },
            { label: "Returns",      href: "/admin/returns",    icon: RefreshCw,    desc: "Disputes workflow" },
            { label: "Trust & Rank", href: "/admin/trust",      icon: BarChart3,    desc: "Swadeshi scoring" },
            { label: "Users",        href: "/admin/users",      icon: Users,        desc: "Buyer accounts" },
            { label: "Audit Logs",   href: "/admin/logs",       icon: AlertCircle,  desc: "Full history" },
          ].map(({ label, href, icon: Icon, desc }, i) => (
            <Link key={href} href={href}
              className="rounded-xl p-3 ag-btn transition-all block"
              style={{ background: "rgba(26,28,28,0.04)", border: "1px solid rgba(26,28,28,0.05)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fcd020"; (e.currentTarget as HTMLElement).style.borderColor = "#fcd020" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(26,28,28,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,28,28,0.05)" }}
            >
              <Icon size={15} className="text-[#1a1c1c]/50 mb-2" />
              <p className="text-[11px] font-black text-[#1a1c1c]">{label}</p>
              <p className="text-[9.5px] text-[#1a1c1c]/35 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* SQL files reference */}
      <div className="ag-card rounded-2xl p-5 ag-slide-up" style={{ animationDelay: "250ms", border: "1px solid rgba(239,68,68,0.12)" }}>
        <div className="flex items-start gap-3">
          <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-[12px] font-black text-[#1a1c1c] mb-1">Database Setup Required</h2>
            <p className="text-[11px] text-[#1a1c1c]/50 mb-3 leading-relaxed">
              If you haven&apos;t already, run these SQL files in your Supabase SQL Editor to enable all features:
            </p>
            <div className="space-y-1.5">
              {[
                { file: "supabase/schema.sql",           desc: "Core tables (run first)"    },
                { file: "supabase/admin-additions.sql",  desc: "Sub-admin + blog + RLS"     },
                { file: "supabase/missing-tables.sql",   desc: "Finance, penalties, returns" },
              ].map(({ file, desc }) => (
                <div key={file} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#1a1c1c]/60 bg-black/5 px-2 py-0.5 rounded">{file}</span>
                  <span className="text-[10px] text-[#1a1c1c]/35">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
