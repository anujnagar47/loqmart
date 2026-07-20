"use client"

import { useEffect, useState } from "react"
import { RefreshCw, TrendingUp, IndianRupee, CreditCard, Building2, Check } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Summary {
  totalGmv: number; platformFees: number; gatewayFees: number; netRevenue: number
  thisMonthGmv: number; lastMonthGmv: number
}
interface SellerRow { id: string; business_name: string; state: string; gmv: number; fee: number; net: number }
interface Settlement {
  id: string; seller_id: string; gross_amount: number; net_payable: number
  platform_fee: number; gateway_fee: number; status: string
  bank_reference: string | null; created_at: string; hold_reason: string | null
  sellers: { business_name: string; state: string } | null
}

const STATUS_PILL: Record<string, { background: string; color: string }> = {
  pending:    { background: "rgba(217,119,6,0.09)",   color: "#b45309" },
  processing: { background: "rgba(37,99,235,0.09)",   color: "#1d4ed8" },
  paid:       { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  held:       { background: "rgba(220,38,38,0.09)",   color: "#b91c1c" },
  disputed:   { background: "rgba(124,58,237,0.09)",  color: "#6d28d9" },
}

export default function FinancePage() {
  const [summary, setSummary]         = useState<Summary | null>(null)
  const [sellers, setSellers]         = useState<SellerRow[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<"overview"|"settlements"|"sellers">("overview")
  const [toast, setToast]             = useState("")

  const load = async () => {
    setLoading(true)
    const [f, s] = await Promise.all([
      fetch("/api/admin/finance").then(r => r.json()),
      fetch("/api/admin/finance/settlements").then(r => r.json()),
    ])
    setSummary(f.summary)
    setSellers(f.sellerBreakdown || [])
    setSettlements(s.settlements || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400) }

  const updateSettlement = async (id: string, status: string) => {
    const r = await fetch(`/api/admin/finance/settlements/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!r.ok) { showToast("Failed to update settlement"); return }
    setSettlements(p => p.map(s => s.id === id ? { ...s, status } : s))
    showToast("Settlement updated")
  }

  const gmvGrowth = summary && summary.lastMonthGmv > 0
    ? ((summary.thisMonthGmv - summary.lastMonthGmv) / summary.lastMonthGmv * 100).toFixed(1)
    : null

  const KPI_CARDS = summary ? [
    { label: "Total GMV",        value: formatCurrency(summary.totalGmv),    icon: TrendingUp,  sub: gmvGrowth ? `${Number(gmvGrowth) > 0 ? "+" : ""}${gmvGrowth}% vs last month` : "All time" },
    { label: "Platform Revenue", value: formatCurrency(summary.platformFees), icon: IndianRupee, sub: "5% platform fee" },
    { label: "This Month GMV",   value: formatCurrency(summary.thisMonthGmv), icon: CreditCard,  sub: `Last: ${formatCurrency(summary.lastMonthGmv)}` },
    { label: "Gateway Fees",     value: formatCurrency(summary.gatewayFees),  icon: Building2,   sub: "Razorpay 2%" },
  ] : []

  return (
    <div className="p-7">
      {toast && (
        <div className="fixed top-6 right-6 z-50 ag-toast">
          <div className="flex items-center gap-3 bg-[#1a1c1c] text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl" style={{ borderLeft: "3px solid #fcd020" }}>
            <Check size={14} className="text-[#fcd020]" /> {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 ag-slide-up">
        <div>
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Finance</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">Settlements, payouts, and revenue tracking</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ag-slide-up" style={{ animationDelay: "60ms" }}>
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="rounded-2xl h-28 ag-shimmer" />) :
        KPI_CARDS.map((k, i) => (
          <div key={k.label} className="ag-card-stat rounded-2xl p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <k.icon size={15} className="text-[#1a1c1c]/30 mb-3" />
            <p className="text-[22px] font-black text-[#1a1c1c] leading-none">{k.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/35 mt-1.5">{k.label}</p>
            {k.sub && <p className="text-[10px] text-[#1a1c1c]/28 mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 ag-slide-up" style={{ animationDelay: "80ms" }}>
        {(["overview","settlements","sellers"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide ag-btn transition-all capitalize"
            style={tab === t ? { background: "#1a1c1c", color: "#fff" } : { background: "rgba(255,255,255,0.7)", color: "rgba(26,28,28,0.45)" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-4 ag-slide-up" style={{ animationDelay: "100ms" }}>
          {[
            { label: "Pending Settlements", value: settlements.filter(s => s.status === "pending").length,    color: "#b45309" },
            { label: "Held Settlements",    value: settlements.filter(s => s.status === "held").length,       color: "#b91c1c" },
            { label: "Paid This Month",     value: settlements.filter(s => s.status === "paid").length,       color: "#15803d" },
          ].map(s => (
            <div key={s.label} className="ag-card rounded-2xl p-6">
              <p className="text-[32px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]/35 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Settlements table */}
      {tab === "settlements" && (
        <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  {["Seller","State","Gross","Platform Fee","Net Payable","Status","Bank Ref","Mark Paid"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <td colSpan={8} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
                  </tr>
                )) : settlements.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-[12px] text-[#1a1c1c]/30">No settlements yet. Run missing-tables.sql to create the settlements table.</td></tr>
                ) : settlements.map((s, i) => (
                  <tr key={s.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 30}ms` }}>
                    <td className="px-5 py-3 font-bold text-[13px]">{s.sellers?.business_name || "-"}</td>
                    <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/45">{s.sellers?.state || "-"}</td>
                    <td className="px-5 py-3 font-bold text-[12px]">{formatCurrency(s.gross_amount)}</td>
                    <td className="px-5 py-3 text-[12px] text-red-600">{formatCurrency(s.platform_fee)}</td>
                    <td className="px-5 py-3 font-bold text-[12px] text-green-700">{formatCurrency(s.net_payable)}</td>
                    <td className="px-5 py-3">
                      <select value={s.status} onChange={e => updateSettlement(s.id, e.target.value)}
                        className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-[#fcd020] cursor-pointer border-0 ag-btn"
                        style={STATUS_PILL[s.status] || { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                        {["pending","processing","paid","held","disputed"].map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-[10px] font-mono text-[#1a1c1c]/35">{s.bank_reference || "—"}</td>
                    <td className="px-5 py-3">
                      {s.status === "pending" && (
                        <button onClick={() => updateSettlement(s.id, "paid")}
                          className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center ag-btn transition-colors">
                          <Check size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seller breakdown */}
      {tab === "sellers" && (
        <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  {["#","Seller","State","GMV","Platform Fee","Net Payable"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <td colSpan={6} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
                  </tr>
                )) : sellers.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-[12px] text-[#1a1c1c]/30">No paid orders yet</td></tr>
                ) : sellers.map((s, i) => (
                  <tr key={s.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 30}ms` }}>
                    <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/28 font-black">{i + 1}</td>
                    <td className="px-5 py-3 font-bold text-[13px]">{s.business_name}</td>
                    <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/45">{s.state}</td>
                    <td className="px-5 py-3 font-bold text-[12px]">{formatCurrency(s.gmv)}</td>
                    <td className="px-5 py-3 text-[12px] text-red-600">{formatCurrency(s.fee)}</td>
                    <td className="px-5 py-3 font-bold text-[12px] text-green-700">{formatCurrency(s.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
