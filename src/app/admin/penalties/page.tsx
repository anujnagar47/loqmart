"use client"

import { useEffect, useState } from "react"
import { Plus, RefreshCw, Check, X, AlertTriangle } from "lucide-react"

interface Penalty {
  id: string; type: string; reason: string; amount_held: number; trust_score_impact: number
  status: string; created_at: string
  sellers: { business_name: string; state: string } | null
}
interface SellerRow { id: string; business_name: string }

const PENALTY_TYPES = [
  { value: "wrong_product",    label: "Wrong Product Shipped",    amount: 100,  trust: -5  },
  { value: "non_fulfillment",  label: "Non-Fulfillment (>5 days)", amount: 50,   trust: -10 },
  { value: "fake_review",      label: "Fake Review Detected",     amount: 0,    trust: -20 },
  { value: "gstin_expired",    label: "GSTIN Expired",            amount: 0,    trust: -5  },
  { value: "counterfeit",      label: "Counterfeit Product",      amount: 500,  trust: -50 },
  { value: "custom",           label: "Custom",                   amount: 0,    trust: 0   },
]

const STATUS_PILL: Record<string, { background: string; color: string }> = {
  active:   { background: "rgba(220,38,38,0.09)",   color: "#b91c1c" },
  resolved: { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  appealed: { background: "rgba(217,119,6,0.09)",   color: "#b45309" },
  waived:   { background: "rgba(100,116,139,0.09)", color: "#475569" },
}

const EMPTY = { seller_id: "", type: "wrong_product", reason: "", amount_held: "100", trust_score_impact: "-5" }

export default function PenaltiesPage() {
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [sellers, setSellers]     = useState<SellerRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState("all")
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState("")

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/penalties?status=${filter}`).then(r => r.json()),
      fetch("/api/admin/sellers").then(r => r.json()),
    ]).then(([p, s]) => {
      setPenalties(p.penalties || [])
      setSellers(s.sellers || [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [filter])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400) }

  const onTypeChange = (type: string) => {
    const preset = PENALTY_TYPES.find(t => t.value === type)
    setForm(f => ({ ...f, type, amount_held: String(preset?.amount ?? 0), trust_score_impact: String(preset?.trust ?? 0) }))
  }

  const issuePenalty = async () => {
    if (!form.seller_id || !form.reason) { showToast("Seller and reason required"); return }
    setSaving(true)
    const r = await fetch("/api/admin/penalties", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seller_id: form.seller_id, type: form.type, reason: form.reason, amount_held: Number(form.amount_held), trust_score_impact: Number(form.trust_score_impact) }),
    })
    const d = await r.json()
    if (d.penalty) { showToast("Penalty issued"); setShowForm(false); setForm(EMPTY); load() }
    else showToast(d.error || "Failed")
    setSaving(false)
  }

  const updatePenalty = async (id: string, status: string) => {
    const r = await fetch(`/api/admin/penalties/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    if (!r.ok) { showToast("Failed to update"); return }
    setPenalties(p => p.map(x => x.id === id ? { ...x, status } : x))
    showToast("Updated")
  }

  const counts = { all: penalties.length, active: penalties.filter(p => p.status === "active").length, resolved: penalties.filter(p => p.status === "resolved").length }

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
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Penalties</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">Seller violations, trust score deductions, held amounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black ag-btn transition-colors"
            style={{ background: "rgba(220,38,38,0.09)", color: "#b91c1c", border: "1px solid rgba(220,38,38,0.15)" }}>
            <AlertTriangle size={13} /> Issue Penalty
          </button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4 mb-5 ag-slide-up" style={{ animationDelay: "60ms" }}>
        {(["all","active","resolved"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} className="ag-card-stat rounded-xl p-4 text-left ag-btn transition-all"
            style={filter === s ? { boxShadow: "0 0 0 2px #fcd020, 0 4px 16px rgba(252,208,32,0.25)" } : {}}>
            <p className="text-[28px] font-black leading-none" style={{ color: s === "active" ? "#b91c1c" : "#1a1c1c" }}>
              {loading ? "—" : counts[s]}
            </p>
            <p className="text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/35 mt-2 capitalize">{s}</p>
          </button>
        ))}
      </div>

      {/* Issue form */}
      {showForm && (
        <div className="ag-card rounded-2xl p-5 mb-5 ag-slide-up" style={{ border: "1px solid rgba(220,38,38,0.18)" }}>
          <h2 className="text-[12px] font-black text-[#1a1c1c] mb-4">Issue Penalty</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Seller *</label>
              <select value={form.seller_id} onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                <option value="">Select seller...</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Violation Type</label>
              <select value={form.type} onChange={e => onTypeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                {PENALTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Amount Held (Rs)</label>
              <input type="number" value={form.amount_held} onChange={e => setForm(f => ({ ...f, amount_held: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Trust Score Impact</label>
              <input type="number" value={form.trust_score_impact} onChange={e => setForm(f => ({ ...f, trust_score_impact: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="-5" />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Reason / Evidence *</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2}
              className="w-full px-3 py-2 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
              style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}
              placeholder="Describe the violation in detail..." />
          </div>
          <div className="flex gap-2">
            <button onClick={issuePenalty} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-white text-[12px] font-black rounded-xl ag-btn disabled:opacity-60 transition-colors"
              style={{ background: "#dc2626" }}>
              <AlertTriangle size={12} /> {saving ? "Issuing..." : "Issue Penalty"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY) }}
              className="px-5 py-2 text-[12px] font-semibold text-[#1a1c1c]/45 hover:bg-black/5 rounded-xl ag-btn transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Seller","State","Violation","Amount Held","Trust Impact","Status","Issued","Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(4)].map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td colSpan={8} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
              </tr>
            )) : penalties.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-[12px] text-[#1a1c1c]/30">No penalties found. Run missing-tables.sql to create the penalties table.</td></tr>
            ) : penalties.map((p, i) => (
              <tr key={p.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 30}ms` }}>
                <td className="px-5 py-3 font-bold text-[13px]">{p.sellers?.business_name || "-"}</td>
                <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/45">{p.sellers?.state || "-"}</td>
                <td className="px-5 py-3">
                  <p className="text-[11px] font-bold text-[#1a1c1c]/65">{PENALTY_TYPES.find(t => t.value === p.type)?.label || p.type}</p>
                  <p className="text-[10px] text-[#1a1c1c]/30 mt-0.5 truncate max-w-[180px]">{p.reason}</p>
                </td>
                <td className="px-5 py-3 font-black text-[13px] text-red-600">Rs {p.amount_held}</td>
                <td className="px-5 py-3">
                  {p.trust_score_impact !== 0 && (
                    <span className="text-[12px] font-black" style={{ color: p.trust_score_impact < 0 ? "#dc2626" : "#16a34a" }}>
                      {p.trust_score_impact > 0 ? "+" : ""}{p.trust_score_impact}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                    style={STATUS_PILL[p.status] || { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/35">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3">
                  {p.status === "active" && (
                    <div className="flex gap-1">
                      <button onClick={() => updatePenalty(p.id, "resolved")} title="Resolve"
                        className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center ag-btn transition-colors">
                        <Check size={12} />
                      </button>
                      <button onClick={() => updatePenalty(p.id, "waived")} title="Waive"
                        className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center ag-btn transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
