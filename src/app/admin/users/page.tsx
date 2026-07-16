"use client"

import { useEffect, useState } from "react"
import { Search, RefreshCw, Trash2, Plus, Check, MapPin } from "lucide-react"

interface UserRow {
  id: string; email: string; full_name: string | null
  role: string; state_scope: string | null; created_at: string
}

const ROLES = ["buyer", "seller", "admin", "sub_admin"]
const INDIAN_STATES = [
  "AN","AP","AR","AS","BR","CH","CG","DD","DL","DN","GA","GJ","HP","HR","JH","JK","KA","KL","LA",
  "LD","MH","ML","MN","MP","MZ","NL","OD","PB","PY","RJ","SK","TG","TN","TR","UP","UT","WB",
]
const EMPTY_FORM = { email: "", full_name: "", password: "", role: "buyer", state_scope: "" }

const ROLE_PILL: Record<string, { background: string; color: string; avatarBg: string }> = {
  admin:     { background: "rgba(124,58,237,0.09)", color: "#6d28d9", avatarBg: "rgba(124,58,237,0.12)" },
  sub_admin: { background: "rgba(67,56,202,0.09)",  color: "#4338ca", avatarBg: "rgba(67,56,202,0.12)"  },
  seller:    { background: "rgba(37,99,235,0.09)",  color: "#1d4ed8", avatarBg: "rgba(37,99,235,0.12)"  },
  buyer:     { background: "rgba(22,163,74,0.09)",  color: "#15803d", avatarBg: "rgba(22,163,74,0.12)"  },
}

export default function UsersPage() {
  const [users, setUsers]         = useState<UserRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [filter, setFilter]       = useState("all")
  const [toast, setToast]         = useState("")
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      setUsers(d.users || [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500) }

  const createUser = async () => {
    if (!form.email || !form.password || !form.full_name) { showToast("All fields required"); return }
    setSaving(true)
    const r = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, state_scope: form.state_scope || null }),
    })
    const d = await r.json()
    if (d.ok) { showToast("User created"); setShowForm(false); setForm(EMPTY_FORM); load() }
    else showToast(d.error || "Failed to create user")
    setSaving(false)
  }

  const updateUser = async (id: string, field: string, value: string) => {
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value || null }) })
    setUsers(p => p.map(u => u.id === id ? { ...u, [field]: value || null } : u))
    showToast("Updated")
  }

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Delete user ${email}?`)) return
    setDeleting(id)
    const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    const d = await r.json()
    if (d.ok) { setUsers(p => p.filter(u => u.id !== id)); showToast("User deleted") }
    else showToast(d.error || "Failed")
    setDeleting(null)
  }

  const filtered = users.filter(u => {
    const matchFilter = filter === "all" || u.role === filter
    const q = search.toLowerCase()
    return matchFilter && (!q || (u.email || "").toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q))
  })

  const counts = {
    all: users.length,
    buyer: users.filter(u => u.role === "buyer").length,
    seller: users.filter(u => u.role === "seller").length,
    admin: users.filter(u => u.role === "admin").length,
    sub_admin: users.filter(u => u.role === "sub_admin").length,
  }

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
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Users</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">{users.length} registered accounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl ag-btn-primary text-[12px] font-black ag-btn">
            <Plus size={13} /> Create User
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="ag-card rounded-2xl p-5 mb-5 ag-slide-up" style={{ border: "1px solid rgba(252,208,32,0.3)" }}>
          <h2 className="text-[12px] font-black text-[#1a1c1c] mb-4">New User Account</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Full Name *</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="Full Name" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Password *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {(form.role === "admin" || form.role === "sub_admin") && (
              <div className="col-span-2">
                <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">
                  <MapPin size={10} className="inline mr-1 text-[#fcd020]" />
                  State Scope (leave blank for full access)
                </label>
                <select value={form.state_scope} onChange={e => setForm(f => ({ ...f, state_scope: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                  style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                  <option value="">Full Access (All States)</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-[10px] text-[#1a1c1c]/35 mt-1">Sub-admins with a state scope can only manage sellers/products from that state.</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={createUser} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 ag-btn-primary text-[12px] font-black rounded-xl ag-btn disabled:opacity-60">
              <Check size={13} /> {saving ? "Creating..." : "Create User"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="px-5 py-2 text-[12px] font-semibold text-[#1a1c1c]/45 hover:bg-black/5 rounded-xl ag-btn transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-5 gap-3 mb-5 ag-slide-up" style={{ animationDelay: "60ms" }}>
        {(["all","buyer","seller","admin","sub_admin"] as const).map(r => (
          <button key={r} onClick={() => setFilter(r)} className="ag-card-stat rounded-xl p-3 text-left ag-btn transition-all"
            style={filter === r ? { boxShadow: "0 0 0 2px #fcd020, 0 4px 16px rgba(252,208,32,0.25)" } : {}}>
            <p className="text-[22px] font-black text-[#1a1c1c] leading-none">{counts[r]}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/35 mt-1.5">{r.replace("_", " ")}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 ag-slide-up" style={{ animationDelay: "80ms" }}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1c1c]/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or name..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#1a1c1c] placeholder:text-[#1a1c1c]/30 focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
          style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
      </div>

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["User","Email","Role","State Scope","Joined","Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(4)].map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td colSpan={6} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-[12px] text-[#1a1c1c]/30">No users found</td></tr>
            ) : filtered.map((u, i) => (
              <tr key={u.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 25}ms` }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                      style={{ background: ROLE_PILL[u.role]?.avatarBg || "rgba(100,116,139,0.1)", color: ROLE_PILL[u.role]?.color || "#475569" }}>
                      {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-[#1a1c1c] text-[12px]">{u.full_name || "No name"}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/45">{u.email}</td>
                <td className="px-5 py-3">
                  <select value={u.role} onChange={e => updateUser(u.id, "role", e.target.value)}
                    className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none"
                    style={ROLE_PILL[u.role] || { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  {(u.role === "admin" || u.role === "sub_admin") ? (
                    <select value={u.state_scope || ""} onChange={e => updateUser(u.id, "state_scope", e.target.value)}
                      className="text-[10px] font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#fcd020]"
                      style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                      <option value="">All States</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : <span className="text-[10px] text-[#1a1c1c]/25">—</span>}
                </td>
                <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/30">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3">
                  <button onClick={() => deleteUser(u.id, u.email)}
                    disabled={deleting === u.id || u.role === "admin"}
                    className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                    style={{ background: "rgba(220,38,38,0.06)", color: "#ef4444" }}
                    title={u.role === "admin" ? "Cannot delete admins" : "Delete"}
                    onMouseEnter={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.14)" }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.06)"}>
                    <Trash2 size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 text-[10.5px] text-[#1a1c1c]/25 font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          Showing {filtered.length} of {users.length}
        </div>
      </div>
    </div>
  )
}
