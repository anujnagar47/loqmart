"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Edit2, Check, X, AlertTriangle, Star } from "lucide-react"

interface SellerTrust {
  id: string; business_name: string; state: string; state_code: string
  swadeshi_rank: number; swadeshi_score: number; trust_score: number
  approval_status: string; total_orders: number; return_ratio: number
}

export default function TrustPage() {
  const [sellers, setSellers]   = useState<SellerTrust[]>([])
  const [loading, setLoading]   = useState(true)
  const [editId, setEditId]     = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ swadeshi_rank: 0, swadeshi_score: 0, trust_score: 0, override_reason: "" })
  const [toast, setToast]       = useState("")
  const [search, setSearch]     = useState("")

  const load = () => {
    setLoading(true)
    fetch("/api/admin/trust").then(r => r.json()).then(d => {
      setSellers(d.sellers || [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400) }

  const startEdit = (s: SellerTrust) => {
    setEditId(s.id)
    setEditForm({ swadeshi_rank: s.swadeshi_rank, swadeshi_score: s.swadeshi_score, trust_score: s.trust_score, override_reason: "" })
  }

  const saveEdit = async () => {
    if (!editForm.override_reason.trim()) { showToast("Override reason is required"); return }
    const r = await fetch("/api/admin/trust", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seller_id: editId, ...editForm }),
    })
    if (r.ok) { setSellers(p => p.map(s => s.id === editId ? { ...s, ...editForm } : s)); showToast("Updated") }
    else showToast("Failed to save")
    setEditId(null)
  }

  const filtered = sellers
    .filter(s => !search || s.business_name.toLowerCase().includes(search.toLowerCase()) || (s.state || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.swadeshi_rank - a.swadeshi_rank)

  const FACTORS = [
    { label: "GST Compliance",      pct: 20 },
    { label: "Product Authenticity", pct: 20 },
    { label: "Customer Ratings",    pct: 20 },
    { label: "Return Ratio",        pct: 15 },
    { label: "Years in Business",   pct: 15 },
    { label: "On-Time Delivery",    pct: 10 },
  ]

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
          <h1 className="text-[22px] font-black text-[#111827] tracking-tight">Trust & Rank</h1>
          <p className="text-[12px] text-[#111827]/40 mt-1">Swadeshi Rank overrides — all changes are audit-logged.</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#111827]/40 hover:text-[#111827] ag-btn">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Algorithm legend */}
      <div className="grid grid-cols-3 gap-4 mb-6 ag-slide-up" style={{ animationDelay: "60ms" }}>
        <div className="ag-card rounded-2xl p-4">
          <p className="text-[9.5px] font-black uppercase tracking-widest text-[#111827]/30 mb-3">Rank Algorithm</p>
          <div className="space-y-2">
            {FACTORS.map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-[11px] text-[#111827]/60">{f.label}</span>
                <span className="text-[11px] font-black text-[#FACC15] bg-[#FACC15]/10 px-1.5 py-0.5 rounded">{f.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ag-card rounded-2xl p-4">
          <p className="text-[9.5px] font-black uppercase tracking-widest text-[#111827]/30 mb-3">Score Ranges</p>
          <div className="space-y-2">
            {[["0–20","Poor trust","#dc2626"],["21–40","Below avg","#d97706"],["41–60","Average","#ca8a04"],["61–80","Good","#16a34a"],["81–100","Excellent","#0284c7"]].map(([r,l,c]) => (
              <div key={r} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c as string }} />
                <span className="text-[10px] font-bold" style={{ color: c as string }}>{r}</span>
                <span className="text-[10px] text-[#111827]/45">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ag-card rounded-2xl p-4">
          <p className="text-[9.5px] font-black uppercase tracking-widest text-[#111827]/30 mb-3">Anti-Gaming Rules</p>
          <div className="space-y-2">
            {["No jump >10 ranks/day","Override requires reason","All overrides audit-logged","Super admin authority only","Return ratio caps score"].map(r => (
              <div key={r} className="flex items-center gap-2">
                <AlertTriangle size={9} className="text-[#d97706] shrink-0" />
                <span className="text-[10px] text-[#111827]/55">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 ag-slide-up" style={{ animationDelay: "80ms" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sellers..."
          className="w-full px-4 py-2.5 rounded-xl text-[13px] text-[#111827] placeholder:text-[#111827]/30 focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
          style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
      </div>

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["#","Seller","State","Swadeshi Rank","Trust Score","Orders","Return Ratio","Status","Override"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                {[...Array(9)].map((_, j) => <td key={j} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>)}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-[12px] text-[#111827]/30">No sellers yet</td></tr>
            ) : filtered.map((s, i) => (
              <>
                <tr key={s.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 30}ms` }}>
                  <td className="px-5 py-3 text-[11px] text-[#111827]/25 font-black">{i + 1}</td>
                  <td className="px-5 py-3 font-bold text-[13px] text-[#111827]">{s.business_name}</td>
                  <td className="px-5 py-3 text-[11px] text-[#111827]/45">{s.state}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Star size={11} className="fill-[#FACC15] text-[#FACC15]" />
                      <span className="font-black text-[#111827] text-[14px]">{s.swadeshi_rank}</span>
                      <span className="text-[10px] text-[#111827]/30">{s.swadeshi_score}pts</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
                        <div className="h-full rounded-full bg-[#FACC15]" style={{ width: `${s.trust_score || 0}%`, transition: "width 0.5s ease" }} />
                      </div>
                      <span className="text-[11px] font-bold text-[#111827]">{s.trust_score || 0}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[12px] font-bold text-[#111827]">{s.total_orders}</td>
                  <td className="px-5 py-3">
                    {s.return_ratio > 20
                      ? <span className="flex items-center gap-1 text-[11px] font-bold text-red-600"><AlertTriangle size={10} />{s.return_ratio}%</span>
                      : <span className="text-[11px] text-[#111827]/40">{s.return_ratio}%</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                      style={s.approval_status === "approved"
                        ? { background: "rgba(22,163,74,0.09)", color: "#15803d" }
                        : { background: "rgba(217,119,6,0.09)", color: "#b45309" }}>
                      {s.approval_status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => editId === s.id ? setEditId(null) : startEdit(s)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                      style={{ background: "rgba(250,204,21,0.12)", color: "#111827" }}>
                      <Edit2 size={11} />
                    </button>
                  </td>
                </tr>
                {editId === s.id && (
                  <tr key={`edit-${s.id}`} style={{ background: "rgba(250,204,21,0.05)", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <td colSpan={9} className="px-5 py-4">
                      <div className="flex items-end gap-4">
                        <div>
                          <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Swadeshi Rank</label>
                          <input type="number" min={1} max={5} value={editForm.swadeshi_rank}
                            onChange={e => setEditForm(f => ({ ...f, swadeshi_rank: Number(e.target.value) }))}
                            className="w-20 px-3 py-1.5 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40"
                            style={{ border: "1px solid rgba(0,0,0,0.1)" }} />
                        </div>
                        <div>
                          <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Trust Score (0-100)</label>
                          <input type="number" min={0} max={100} value={editForm.trust_score}
                            onChange={e => setEditForm(f => ({ ...f, trust_score: Number(e.target.value) }))}
                            className="w-24 px-3 py-1.5 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40"
                            style={{ border: "1px solid rgba(0,0,0,0.1)" }} />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Override Reason *</label>
                          <input value={editForm.override_reason}
                            onChange={e => setEditForm(f => ({ ...f, override_reason: e.target.value }))}
                            placeholder="Required — why are you overriding?"
                            className="w-full px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40"
                            style={{ border: "1px solid rgba(0,0,0,0.1)" }} />
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={saveEdit} className="w-8 h-8 rounded-lg ag-btn-primary flex items-center justify-center ag-btn"><Check size={13} /></button>
                          <button onClick={() => setEditId(null)} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center ag-btn"><X size={13} /></button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
