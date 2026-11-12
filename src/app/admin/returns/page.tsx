"use client"

import { useEffect, useState } from "react"
import { Search, RefreshCw, ChevronDown, Check } from "lucide-react"

interface Return {
  id: string; reason: string; description: string | null; status: string
  refund_amount: number | null; refund_processed: boolean; created_at: string
  orders: { order_number: string; total: number } | null
  sellers: { business_name: string; state: string } | null
  users: { email: string; full_name: string } | null
}

const STATUSES = ["all","pending","seller_accepted","seller_disputed","admin_review","resolved_buyer","resolved_seller","closed"]

const STATUS_PILL: Record<string, { background: string; color: string }> = {
  pending:          { background: "rgba(217,119,6,0.09)",   color: "#b45309" },
  seller_accepted:  { background: "rgba(37,99,235,0.09)",   color: "#1d4ed8" },
  seller_disputed:  { background: "rgba(217,119,6,0.12)",   color: "#b45309" },
  admin_review:     { background: "rgba(124,58,237,0.09)",  color: "#6d28d9" },
  resolved_buyer:   { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  resolved_seller:  { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  closed:           { background: "rgba(100,116,139,0.09)", color: "#475569" },
}

const REASON_LABELS: Record<string, string> = {
  damaged:          "Damaged",
  wrong_product:    "Wrong Product",
  not_as_described: "Not as Described",
}

export default function ReturnsPage() {
  const [returns, setReturns]   = useState<Return[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState("all")
  const [search, setSearch]     = useState("")
  const [toast, setToast]       = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/returns?status=${filter}`).then(r => r.json()).then(d => {
      setReturns(d.returns || [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [filter])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400) }

  const update = async (id: string, status: string, notes?: string) => {
    await fetch(`/api/admin/returns/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, resolution_notes: notes }),
    })
    setReturns(p => p.map(r => r.id === id ? { ...r, status } : r))
    showToast("Updated")
  }

  const filtered = returns.filter(r => {
    const q = search.toLowerCase()
    return !q || (r.orders?.order_number || "").toLowerCase().includes(q) || (r.users?.email || "").toLowerCase().includes(q) || (r.sellers?.business_name || "").toLowerCase().includes(q)
  })

  const counts: Record<string, number> = { all: returns.length }
  STATUSES.slice(1).forEach(s => { counts[s] = returns.filter(r => r.status === s).length })

  return (
    <div className="p-7">
      {toast && (
        <div className="fixed top-6 right-6 z-50 ag-toast">
          <div className="flex items-center gap-3 bg-[#111827] text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl" style={{ borderLeft: "3px solid #FACC15" }}>
            <Check size={14} className="text-[#FACC15]" /> {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 ag-slide-up">
        <div>
          <h1 className="text-[22px] font-black text-[#111827] tracking-tight">Returns & Disputes</h1>
          <p className="text-[12px] text-[#111827]/40 mt-1">{returns.length} total requests</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#111827]/40 hover:text-[#111827] ag-btn">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Quick tiles */}
      <div className="grid grid-cols-4 gap-3 mb-5 ag-slide-up" style={{ animationDelay: "60ms" }}>
        {["pending","seller_disputed","admin_review","resolved_buyer"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className="ag-card-stat rounded-xl p-3 text-left ag-btn transition-all"
            style={filter === s ? { boxShadow: "0 0 0 2px #FACC15, 0 4px 16px rgba(250,204,21,0.25)" } : {}}>
            <p className="text-[24px] font-black text-[#111827] leading-none">{loading ? "—" : counts[s] || 0}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#111827]/35 mt-1.5 leading-tight">{s.replace(/_/g, " ")}</p>
          </button>
        ))}
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2 mb-4 ag-slide-up" style={{ animationDelay: "80ms" }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className="px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wide ag-btn transition-all"
            style={filter === s
              ? { background: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(17,24,39,0.08)" }
              : { background: "transparent", color: "#4B5563", border: "1px solid transparent" }}>
            {s.replace(/_/g, " ")} {counts[s] != null ? `(${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 ag-slide-up" style={{ animationDelay: "90ms" }}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111827]/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order #, customer, seller..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#111827] placeholder:text-[#111827]/30 focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
          style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
      </div>

      {/* Return cards */}
      <div className="space-y-2 ag-slide-up" style={{ animationDelay: "110ms" }}>
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="rounded-2xl h-16 ag-shimmer" />) :
        filtered.length === 0 ? (
          <div className="ag-card rounded-2xl p-12 text-center text-[12px] text-[#111827]/30">
            No return requests found. Run missing-tables.sql to create the return_requests table.
          </div>
        ) : filtered.map((r, i) => (
          <div key={r.id} className="ag-card rounded-2xl overflow-hidden ag-row-in" style={{ animationDelay: `${i * 35}ms` }}>
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer"
              onClick={() => setExpanded(e => e === r.id ? null : r.id)}>
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-bold text-[#111827] text-[13px]">{r.orders?.order_number || "Unknown"}</p>
                  <p className="text-[10px] text-[#111827]/40 mt-0.5">{r.users?.email} · {r.sellers?.business_name}</p>
                </div>
                <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                  style={STATUS_PILL[r.status] || { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                  {r.status.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] font-semibold text-[#111827]/40">
                  {REASON_LABELS[r.reason] || r.reason}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {r.refund_amount && (
                  <span className="text-[13px] font-black text-green-700">Rs {r.refund_amount}</span>
                )}
                <span className="text-[11px] text-[#111827]/30">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                <ChevronDown size={13} className="text-[#111827]/25 transition-transform"
                  style={{ transform: expanded === r.id ? "rotate(180deg)" : "" }} />
              </div>
            </div>
            {expanded === r.id && (
              <div className="px-5 pb-4" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <p className="text-[12px] text-[#111827]/55 mt-3 mb-4 leading-relaxed">{r.description || "No description provided"}</p>
                <div className="flex flex-wrap gap-2">
                  {r.status === "pending" && <>
                    <button onClick={() => update(r.id, "admin_review")}
                      className="px-3 py-1.5 text-[11px] font-black rounded-lg ag-btn transition-colors"
                      style={{ background: "rgba(124,58,237,0.09)", color: "#6d28d9" }}>
                      Take for Review
                    </button>
                    <button onClick={() => update(r.id, "resolved_buyer", "Resolved in favour of buyer")}
                      className="px-3 py-1.5 text-[11px] font-black rounded-lg ag-btn transition-colors"
                      style={{ background: "rgba(22,163,74,0.09)", color: "#15803d" }}>
                      Resolve: Buyer
                    </button>
                    <button onClick={() => update(r.id, "resolved_seller", "Resolved in favour of seller")}
                      className="px-3 py-1.5 text-[11px] font-black rounded-lg ag-btn transition-colors"
                      style={{ background: "rgba(37,99,235,0.09)", color: "#1d4ed8" }}>
                      Resolve: Seller
                    </button>
                  </>}
                  {r.status === "admin_review" && <>
                    <button onClick={() => update(r.id, "resolved_buyer", "Admin ruled: buyer wins")}
                      className="px-3 py-1.5 text-[11px] font-black rounded-lg ag-btn transition-colors"
                      style={{ background: "rgba(22,163,74,0.09)", color: "#15803d" }}>
                      Rule: Buyer Wins
                    </button>
                    <button onClick={() => update(r.id, "resolved_seller", "Admin ruled: seller wins")}
                      className="px-3 py-1.5 text-[11px] font-black rounded-lg ag-btn transition-colors"
                      style={{ background: "rgba(37,99,235,0.09)", color: "#1d4ed8" }}>
                      Rule: Seller Wins
                    </button>
                  </>}
                  {!["closed","resolved_buyer","resolved_seller"].includes(r.status) && (
                    <button onClick={() => update(r.id, "closed", "Closed by admin")}
                      className="px-3 py-1.5 text-[11px] font-black rounded-lg ag-btn transition-colors"
                      style={{ background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                      Close
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
