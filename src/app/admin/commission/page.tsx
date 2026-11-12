"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, RefreshCw, Check, Info } from "lucide-react"

interface Setting {
  id: string; scope: string; rate: number; gateway_rate: number; notes: string | null
  effective_from: string
  categories?: { name: string } | null
  sellers?: { business_name: string } | null
}
interface Seller   { id: string; business_name: string }
interface Category { id: string; name: string }

const EMPTY = { scope: "global", category_id: "", seller_id: "", rate: "5", gateway_rate: "2", notes: "" }

const SCOPE_PILL: Record<string, { background: string; color: string }> = {
  global:   { background: "rgba(124,58,237,0.09)", color: "#6d28d9" },
  category: { background: "rgba(37,99,235,0.09)",  color: "#1d4ed8" },
  seller:   { background: "rgba(22,163,74,0.09)",  color: "#15803d" },
}

export default function CommissionPage() {
  const [settings, setSettings]     = useState<Setting[]>([])
  const [sellers, setSellers]       = useState<Seller[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState("")

  const load = async () => {
    setLoading(true)
    const [c, s, cat] = await Promise.all([
      fetch("/api/admin/commission").then(r => r.json()),
      fetch("/api/admin/sellers").then(r => r.json()),
      fetch("/api/admin/categories").then(r => r.json()),
    ])
    setSettings(c.settings || [])
    setSellers(s.sellers || [])
    setCategories(cat.categories || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400) }

  const save = async () => {
    setSaving(true)
    const r = await fetch("/api/admin/commission", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rate: Number(form.rate), gateway_rate: Number(form.gateway_rate), category_id: form.category_id || null, seller_id: form.seller_id || null }),
    })
    const d = await r.json()
    if (d.setting) { showToast("Saved"); setShowForm(false); setForm(EMPTY); load() }
    else showToast(d.error || "Failed")
    setSaving(false)
  }

  const remove = async (id: string, scope: string) => {
    if (scope === "global") { showToast("Cannot delete global rate"); return }
    if (!confirm("Delete this commission rule?")) return
    await fetch("/api/admin/commission", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setSettings(p => p.filter(s => s.id !== id))
    showToast("Deleted")
  }

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
          <h1 className="text-[22px] font-black text-[#111827] tracking-tight">Commission Settings</h1>
          <p className="text-[12px] text-[#111827]/40 mt-1">Platform fee rates — all changes are audit-logged.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#111827]/40 hover:text-[#111827] ag-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl ag-btn-primary text-[12px] font-black ag-btn">
            <Plus size={13} /> Add Rule
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="ag-card rounded-2xl p-4 mb-5 ag-slide-up" style={{ animationDelay: "60ms", border: "1px solid rgba(234,179,8,0.2)" }}>
        <div className="flex items-start gap-3">
          <Info size={14} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-on-surface">Commission Hierarchy</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Seller override beats category override, which beats global rate. Global is always the fallback.</p>
          </div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="ag-card rounded-2xl p-5 mb-5 ag-slide-up" style={{ border: "1px solid rgba(250,204,21,0.3)" }}>
          <h2 className="text-[12px] font-black text-[#111827] mb-4">New Commission Rule</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Scope</label>
              <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value, category_id: "", seller_id: "" }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                <option value="global">Global (all sellers)</option>
                <option value="category">Per Category</option>
                <option value="seller">Per Seller</option>
              </select>
            </div>
            {form.scope === "category" && (
              <div>
                <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Category</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                  style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {form.scope === "seller" && (
              <div>
                <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Seller</label>
                <select value={form.seller_id} onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                  style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                  <option value="">Select...</option>
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Platform Fee %</label>
              <input type="number" min="0" max="30" step="0.5" value={form.rate}
                onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Gateway Fee %</label>
              <input type="number" min="0" max="10" step="0.1" value={form.gateway_rate}
                onChange={e => setForm(f => ({ ...f, gateway_rate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Reason for this rate..."
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 ag-btn-primary text-[12px] font-black rounded-xl ag-btn disabled:opacity-60">
              <Check size={13} /> {saving ? "Saving..." : "Save Rule"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY) }}
              className="px-5 py-2 text-[12px] font-semibold text-[#111827]/45 hover:bg-black/5 rounded-xl ag-btn transition-colors">
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
              {["Scope","Target","Platform Fee","Gateway Fee","Net to Seller","Notes","Since",""].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(3)].map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td colSpan={8} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
              </tr>
            )) : settings.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-[12px] text-[#111827]/30">No commission rules. Run missing-tables.sql to create the commission_settings table.</td></tr>
            ) : settings.map((s, i) => (
              <tr key={s.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 40}ms` }}>
                <td className="px-5 py-3">
                  <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                    style={SCOPE_PILL[s.scope] || { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                    {s.scope}
                  </span>
                </td>
                <td className="px-5 py-3 text-[12px] font-bold text-[#111827]">
                  {s.categories?.name || s.sellers?.business_name || "All sellers"}
                </td>
                <td className="px-5 py-3">
                  <span className="text-[16px] font-black text-[#111827]">{s.rate}%</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[14px] font-bold text-[#111827]/55">{s.gateway_rate}%</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[14px] font-bold text-green-700">{(100 - s.rate - s.gateway_rate).toFixed(1)}%</span>
                </td>
                <td className="px-5 py-3 text-[11px] text-[#111827]/40">{s.notes || "—"}</td>
                <td className="px-5 py-3 text-[11px] text-[#111827]/30">{new Date(s.effective_from).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3">
                  {s.scope !== "global" && (
                    <button onClick={() => remove(s.id, s.scope)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                      style={{ background: "rgba(220,38,38,0.06)", color: "#ef4444" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.14)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.06)"}>
                      <Trash2 size={11} />
                    </button>
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
