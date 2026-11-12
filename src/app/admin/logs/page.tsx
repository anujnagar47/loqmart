"use client"

import React, { useEffect, useState } from "react"
import { Search, RefreshCw, Check } from "lucide-react"

interface Log {
  id: string; action: string; target_type: string | null; target_id: string | null
  old_value: unknown; new_value: unknown; notes: string | null; created_at: string
  users: { full_name: string; email: string } | null
}

const ACTION_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  "seller.approve":    { bg: "rgba(22,163,74,0.07)",   text: "#15803d",  dot: "#16a34a" },
  "seller.reject":     { bg: "rgba(220,38,38,0.07)",   text: "#b91c1c",  dot: "#dc2626" },
  "product.approve":   { bg: "rgba(22,163,74,0.07)",   text: "#15803d",  dot: "#16a34a" },
  "product.reject":    { bg: "rgba(220,38,38,0.07)",   text: "#b91c1c",  dot: "#dc2626" },
  "user.delete":       { bg: "rgba(220,38,38,0.07)",   text: "#b91c1c",  dot: "#dc2626" },
  "penalty.issue":     { bg: "rgba(217,119,6,0.07)",   text: "#b45309",  dot: "#d97706" },
  "return.update":     { bg: "rgba(37,99,235,0.07)",   text: "#1d4ed8",  dot: "#2563eb" },
  "trust.override":    { bg: "rgba(124,58,237,0.07)",  text: "#6d28d9",  dot: "#7c3aed" },
  "commission.update": { bg: "rgba(217,119,6,0.07)",   text: "#b45309",  dot: "#d97706" },
  "settlement.update": { bg: "rgba(99,102,241,0.07)",  text: "#4338ca",  dot: "#6366f1" },
}

const DEFAULT_COLOR = { bg: "rgba(100,116,139,0.07)", text: "#475569", dot: "#94a3b8" }

export default function LogsPage() {
  const [logs, setLogs]         = useState<Log[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/logs?limit=300").then(r => r.json()).then(d => {
      setLogs(d.logs || [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    return !q || l.action.includes(q) || (l.target_type || "").includes(q) || (l.users?.email || "").toLowerCase().includes(q) || (l.users?.full_name || "").toLowerCase().includes(q)
  })

  const uniqueActions = [...new Set(logs.map(l => l.action))]

  const timeStr = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 ag-slide-up">
        <div>
          <h1 className="text-[22px] font-black text-[#111827] tracking-tight">Audit Logs</h1>
          <p className="text-[12px] text-[#111827]/40 mt-1">Immutable record of every admin action. Read-only.</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#111827]/40 hover:text-[#111827] ag-btn">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Action chips */}
      <div className="flex flex-wrap gap-2 mb-5 ag-slide-up" style={{ animationDelay: "60ms" }}>
        {uniqueActions.slice(0, 14).map(a => {
          const c = ACTION_COLOR[a] || DEFAULT_COLOR
          const active = search === a
          return (
            <button key={a} onClick={() => setSearch(active ? "" : a)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wide ag-btn transition-all"
              style={active
                ? { background: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(17,24,39,0.08)" }
                : { background: "transparent", color: "#4B5563", border: "1px solid transparent" }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? "#FACC15" : c.dot }} />
              {a} ({logs.filter(l => l.action === a).length})
            </button>
          )
        })}
        {search && !uniqueActions.includes(search) && (
          <button onClick={() => setSearch("")} className="px-2.5 py-1 rounded-full text-[9.5px] font-black text-[#111827]/35 hover:text-[#111827] ag-btn">
            Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5 ag-slide-up" style={{ animationDelay: "80ms" }}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111827]/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by action, target, or admin..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#111827] placeholder:text-[#111827]/30 focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
          style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
      </div>

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Time", "Admin", "Action", "Target", "Details"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(8)].map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td colSpan={5} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
              </tr>
            )) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center">
                  <p className="text-[13px] text-[#111827]/30 font-medium">No logs yet. Admin actions will appear here.</p>
                </td>
              </tr>
            ) : filtered.map((l, i) => {
              const c = ACTION_COLOR[l.action] || DEFAULT_COLOR
              return (
                <React.Fragment key={l.id}>
                  <tr className="ag-table-row ag-row-in cursor-pointer"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 25}ms` }}
                    onClick={() => setExpanded(e => e === l.id ? null : l.id)}>
                    <td className="px-5 py-3">
                      <p className="text-[11px] font-bold text-[#111827]">{timeStr(l.created_at)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[12px] font-bold text-[#111827]">{l.users?.full_name || "System"}</p>
                      <p className="text-[10px] text-[#111827]/35">{l.users?.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                        style={{ background: c.bg, color: c.text }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
                        {l.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-[#111827]/50">
                      {l.target_type && <span className="font-bold">{l.target_type}</span>}
                      {l.target_id  && <span className="block font-mono text-[9px] text-[#111827]/25 mt-0.5">{l.target_id.slice(0, 8)}…</span>}
                    </td>
                    <td className="px-5 py-3 text-[10.5px] text-[#111827]/30">
                      {expanded !== l.id && (l.notes || (l.new_value ? "Click to expand" : ""))}
                    </td>
                  </tr>
                  {expanded === l.id && (
                    <tr style={{ background: "rgba(250,204,21,0.04)", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                      <td colSpan={5} className="px-5 py-4">
                        <pre className="text-[10px] font-mono text-[#111827]/60 max-w-2xl overflow-x-auto rounded-xl p-3"
                          style={{ background: "rgba(0,0,0,0.04)" }}>
                          {JSON.stringify(l.new_value || l.old_value || l.notes, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 text-[10.5px] text-[#111827]/25 font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          {filtered.length} of {logs.length} log entries
        </div>
      </div>
    </div>
  )
}
