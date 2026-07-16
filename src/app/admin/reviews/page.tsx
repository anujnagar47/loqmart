"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Flag, EyeOff, Trash2, Eye, Star, Search, Check } from "lucide-react"

interface Review {
  id: string; rating: number; title: string | null; comment: string | null
  is_verified: boolean; is_flagged: boolean; is_hidden: boolean; flag_reason: string | null
  created_at: string; helpful_count: number
  products: { name: string } | null
  users: { email: string; full_name: string } | null
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState("all")
  const [search, setSearch]   = useState("")
  const [toast, setToast]     = useState("")

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/reviews?filter=${filter}`).then(r => r.json()).then(d => {
      setReviews(d.reviews || [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [filter])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400) }

  const update = async (id: string, patch: Record<string, unknown>) => {
    await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) })
    setReviews(p => p.map(r => r.id === id ? { ...r, ...patch } : r))
    showToast("Updated")
  }

  const remove = async (id: string) => {
    if (!confirm("Permanently delete this review?")) return
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" })
    setReviews(p => p.filter(r => r.id !== id))
    showToast("Deleted")
  }

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase()
    return !q || (r.products?.name || "").toLowerCase().includes(q) || (r.users?.email || "").toLowerCase().includes(q) || (r.comment || "").toLowerCase().includes(q)
  })

  const counts = { all: reviews.length, flagged: reviews.filter(r => r.is_flagged).length, hidden: reviews.filter(r => r.is_hidden).length }

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
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Reviews</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">Moderate buyer reviews across all products</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter tiles */}
      <div className="grid grid-cols-3 gap-4 mb-5 ag-slide-up" style={{ animationDelay: "60ms" }}>
        {(["all","flagged","hidden"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className="ag-card-stat rounded-xl p-4 text-left ag-btn transition-all"
            style={filter === f ? { boxShadow: "0 0 0 2px #fcd020, 0 4px 16px rgba(252,208,32,0.25)" } : {}}>
            <p className="text-[28px] font-black leading-none"
              style={{ color: f === "flagged" ? "#d97706" : f === "hidden" ? "#64748b" : "#1a1c1c" }}>
              {loading ? "—" : counts[f]}
            </p>
            <p className="text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/35 mt-2 capitalize">{f}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 ag-slide-up" style={{ animationDelay: "80ms" }}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1c1c]/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#1a1c1c] placeholder:text-[#1a1c1c]/30 focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
          style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
      </div>

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Product","Reviewer","Rating","Review","Status","Date","Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td colSpan={7} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-[12px] text-[#1a1c1c]/30">No reviews found</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.id} className={`ag-table-row ag-row-in ${r.is_hidden ? "opacity-45" : ""}`}
                style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 30}ms` }}>
                <td className="px-5 py-3">
                  <p className="font-bold text-[13px] text-[#1a1c1c] truncate max-w-[140px]">{r.products?.name || "Unknown"}</p>
                </td>
                <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/50">{r.users?.email || "-"}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={10} fill={idx < r.rating ? "#fcd020" : "none"} stroke={idx < r.rating ? "#fcd020" : "#d1d5db"} />
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3">
                  {r.title && <p className="font-bold text-[12px] text-[#1a1c1c]">{r.title}</p>}
                  <p className="text-[10.5px] text-[#1a1c1c]/45 truncate max-w-[200px]">{r.comment || "-"}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {r.is_flagged && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(217,119,6,0.09)", color: "#b45309" }}>Flagged</span>
                    )}
                    {r.is_hidden && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(100,116,139,0.09)", color: "#475569" }}>Hidden</span>
                    )}
                    {!r.is_flagged && !r.is_hidden && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(22,163,74,0.09)", color: "#15803d" }}>OK</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/35">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => update(r.id, { is_flagged: !r.is_flagged })} title="Flag"
                      className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                      style={r.is_flagged ? { background: "rgba(217,119,6,0.12)", color: "#b45309" } : { background: "rgba(217,119,6,0.06)", color: "#d97706" }}>
                      <Flag size={11} />
                    </button>
                    <button onClick={() => update(r.id, { is_hidden: !r.is_hidden })} title="Hide/Show"
                      className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                      style={r.is_hidden ? { background: "rgba(100,116,139,0.12)", color: "#475569" } : { background: "rgba(100,116,139,0.06)", color: "#94a3b8" }}>
                      {r.is_hidden ? <Eye size={11} /> : <EyeOff size={11} />}
                    </button>
                    <button onClick={() => remove(r.id)} title="Delete"
                      className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                      style={{ background: "rgba(220,38,38,0.06)", color: "#ef4444" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.14)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.06)"}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 text-[10.5px] text-[#1a1c1c]/25 font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          {filtered.length} of {reviews.length} reviews
        </div>
      </div>
    </div>
  )
}
