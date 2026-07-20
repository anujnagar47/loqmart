"use client"

import React, { useEffect, useState } from "react"
import { Check, X, Search, RefreshCw, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Seller {
  id: string; business_name: string; owner_name: string; state: string | null
  gstin: string | null; swadeshi_rank: number | null; phone: string | null
  approval_status: string; created_at: string; user_id: string
}

interface CommissionSetting {
  id: string;
  scope: string;
  rate: number;
  gateway_rate: number;
  notes: string | null;
  effective_from: string;
}

interface SellerDetail {
  seller: Seller & { address: string | null; city: string | null; pincode: string | null; description: string | null; pan: string | null; bank_account_number: string | null; bank_ifsc: string | null; swadeshi_score: number | null; trust_score: number | null; rejection_reason: string | null }
  stats: { totalRevenue: number; totalOrders: number; activeProducts: number; totalProducts: number }
  products: Array<{ id: string; name: string; approval_status: string; price: number; stock: number; sold_count: number }>
  commission?: CommissionSetting | null
}

const STATUS_BG: Record<string, { bg: string; text: string }> = {
  approved: { bg: "rgba(22,163,74,0.09)",  text: "#15803d" },
  pending:  { bg: "rgba(217,119,6,0.09)",  text: "#b45309" },
  rejected: { bg: "rgba(220,38,38,0.09)",  text: "#b91c1c" },
}

export default function SellersPage() {
  const [sellers, setSellers]           = useState<Seller[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [filter, setFilter]             = useState("all")
  const [toast, setToast]               = useState("")
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [detail, setDetail]             = useState<Record<string, SellerDetail>>({})
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)

  const [editingCommissionSellerId, setEditingCommissionSellerId] = useState<string | null>(null)
  const [editRate, setEditRate] = useState("5")
  const [editGatewayRate, setEditGatewayRate] = useState("2")
  const [editNotes, setEditNotes] = useState("")
  const [savingCommission, setSavingCommission] = useState(false)

  const startEditingCommission = (sellerId: string, comm: CommissionSetting | null | undefined) => {
    setEditingCommissionSellerId(sellerId)
    setEditRate(comm ? comm.rate.toString() : "5")
    setEditGatewayRate(comm ? comm.gateway_rate.toString() : "2")
    setEditNotes(comm ? comm.notes || "" : "")
  }

  const cancelEditingCommission = () => {
    setEditingCommissionSellerId(null)
  }

  const updateCommission = async (sellerId: string) => {
    setSavingCommission(true)
    const r = await fetch("/api/admin/commission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "seller",
        seller_id: sellerId,
        rate: Number(editRate),
        gateway_rate: Number(editGatewayRate),
        notes: editNotes,
      }),
    })
    const d = await r.json()
    if (d.setting) {
      setDetail(prev => {
        const curr = prev[sellerId]
        if (!curr) return prev
        return {
          ...prev,
          [sellerId]: {
            ...curr,
            commission: d.setting
          }
        }
      })
      setEditingCommissionSellerId(null)
      showToast("Commission override saved")
    } else {
      showToast(d.error || "Failed to save commission")
    }
    setSavingCommission(false)
  }

  const resetCommission = async (sellerId: string, id: string) => {
    if (!confirm("Are you sure you want to reset this seller to default commission rates?")) return
    setSavingCommission(true)
    const r = await fetch("/api/admin/commission", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (r.ok) {
      setDetail(prev => {
        const curr = prev[sellerId]
        if (!curr) return prev
        return {
          ...prev,
          [sellerId]: {
            ...curr,
            commission: null
          }
        }
      })
      showToast("Reset to default commission")
    } else {
      showToast("Failed to reset commission")
    }
    setSavingCommission(false)
  }

  const load = () => {
    setLoading(true)
    fetch("/api/admin/sellers").then(r => r.json()).then(d => {
      setSellers(d.sellers || [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2400) }

  const [approvingSellerId, setApprovingSellerId] = useState<string | null>(null)
  const [approveRate, setApproveRate] = useState("5")
  const [approveGatewayRate, setApproveGatewayRate] = useState("2")
  const [approveNotes, setApproveNotes] = useState("Initial rate set during approval")
  const [savingApproval, setSavingApproval] = useState(false)

  const startApproving = (id: string) => {
    setApprovingSellerId(id)
    setApproveRate("5")
    setApproveGatewayRate("2")
    setApproveNotes("Initial rate set during approval")
  }

  const submitApproval = async (useCustomRates: boolean) => {
    if (!approvingSellerId) return
    setSavingApproval(true)
    const payload = useCustomRates 
      ? { rate: Number(approveRate), gateway_rate: Number(approveGatewayRate), notes: approveNotes }
      : {}
    const r = await fetch(`/api/admin/sellers/${approvingSellerId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    if (r.ok) {
      setSellers(p => p.map(s => s.id === approvingSellerId ? { ...s, approval_status: "approved" } : s))
      setDetail(prev => {
        const curr = prev[approvingSellerId]
        if (!curr) return prev
        return {
          ...prev,
          [approvingSellerId]: {
            ...curr,
            seller: {
              ...curr.seller,
              approval_status: "approved"
            },
            commission: useCustomRates ? {
              id: "temp-" + Date.now(),
              scope: "seller",
              rate: Number(approveRate),
              gateway_rate: Number(approveGatewayRate),
              notes: approveNotes,
              effective_from: new Date().toISOString()
            } : null
          }
        }
      })
      showToast("Seller approved")
      setApprovingSellerId(null)
    } else {
      showToast("Failed to approve seller")
    }
    setSavingApproval(false)
  }

  const updateStatus = async (id: string, status: string) => {
    if (status === "approved") {
      startApproving(id)
      return
    }
    const endpoint = "reject"
    const r = await fetch(`/api/admin/sellers/${id}/${endpoint}`, { method: "POST" })
    if (!r.ok) { showToast("Failed to update seller"); return }
    setSellers(p => p.map(s => s.id === id ? { ...s, approval_status: status } : s))
    showToast(`Seller ${status}`)
  }

  const updateRank = async (id: string, rank: number | null) => {
    const r = await fetch(`/api/admin/sellers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ swadeshi_rank: rank }) })
    if (!r.ok) { showToast("Failed to update rank"); return }
    setSellers(p => p.map(s => s.id === id ? { ...s, swadeshi_rank: rank } : s))
    showToast("Swadeshi rank updated")
  }

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (detail[id]) return
    setLoadingDetail(id)
    const r = await fetch(`/api/admin/sellers/${id}`)
    if (r.ok) {
      const d = await r.json()
      setDetail(prev => ({ ...prev, [id]: d }))
    }
    setLoadingDetail(null)
  }

  const filtered = sellers.filter(s => {
    const matchFilter = filter === "all" || s.approval_status === filter
    const q = search.toLowerCase()
    return matchFilter && (!q || s.business_name.toLowerCase().includes(q) || s.owner_name.toLowerCase().includes(q) || (s.state || "").toLowerCase().includes(q))
  })

  const counts = {
    all: sellers.length,
    approved: sellers.filter(s => s.approval_status === "approved").length,
    pending:  sellers.filter(s => s.approval_status === "pending").length,
    rejected: sellers.filter(s => s.approval_status === "rejected").length,
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
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Sellers</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">{sellers.length} total · {counts.pending} pending · {counts.approved} approved</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5 ag-slide-up" style={{ animationDelay: "60ms" }}>
        {(["all", "approved", "pending", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide ag-btn transition-all"
            style={filter === f
              ? { background: "#1a1c1c", color: "#fff" }
              : { background: "rgba(255,255,255,0.7)", color: "rgba(26,28,28,0.45)" }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 ag-slide-up" style={{ animationDelay: "80ms" }}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1c1c]/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search business name, owner, or state..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#1a1c1c] placeholder:text-[#1a1c1c]/30 focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
          style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
      </div>

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["","Business","Owner","State","GSTIN","Swadeshi Rank","Status","Joined","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                  <td colSpan={9} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-[12px] text-[#1a1c1c]/30">No sellers found</td></tr>
              ) : filtered.map((s, i) => (
                <React.Fragment key={s.id}>
                  <tr className="ag-table-row ag-row-in cursor-pointer"
                    style={{ borderBottom: expanded === s.id ? "none" : "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 35}ms` }}
                    onClick={() => toggleExpand(s.id)}>
                    <td className="px-4 py-3">
                      <ChevronDown size={12} className="text-[#1a1c1c]/25 transition-transform"
                        style={{ transform: expanded === s.id ? "rotate(180deg)" : "" }} />
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1a1c1c] text-[13px]">{s.business_name}</td>
                    <td className="px-4 py-3 text-[12px] text-[#1a1c1c]/55">{s.owner_name}</td>
                    <td className="px-4 py-3 text-[12px] text-[#1a1c1c]/50">{s.state || "-"}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#1a1c1c]/40">{s.gstin || "-"}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select value={s.swadeshi_rank ?? ""} onChange={e => updateRank(s.id, e.target.value === "" ? null : Number(e.target.value))}
                        className="text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#fcd020] ag-btn"
                        style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                        <option value="">None</option>
                        {[1,2,3,4,5].map(r => <option key={r} value={r}>Rank {r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {STATUS_BG[s.approval_status] ? (
                        <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                          style={{ background: STATUS_BG[s.approval_status].bg, color: STATUS_BG[s.approval_status].text }}>
                          {s.approval_status}
                        </span>
                      ) : <span className="text-[9.5px] text-[#1a1c1c]/40">{s.approval_status}</span>}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#1a1c1c]/35">{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {s.approval_status !== "approved" && (
                          <button onClick={() => updateStatus(s.id, "approved")} title="Approve"
                            className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center ag-btn transition-colors">
                            <Check size={12} />
                          </button>
                        )}
                        {s.approval_status !== "rejected" && (
                          <button onClick={() => updateStatus(s.id, "rejected")} title="Reject"
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center ag-btn transition-colors">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expanded === s.id && (
                    <tr key={`${s.id}-detail`}>
                      <td colSpan={9} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "rgba(252,208,32,0.025)" }}>
                        {loadingDetail === s.id ? (
                          <div className="px-8 py-5 space-y-2">
                            {[...Array(2)].map((_, i) => <div key={i} className="h-3 ag-shimmer rounded" />)}
                          </div>
                        ) : detail[s.id] ? (() => {
                          const d = detail[s.id]
                          const { seller: sd, stats, products } = d
                          return (
                            <div className="px-8 py-6">
                              {/* Stats row */}
                              <div className="grid grid-cols-4 gap-4 mb-6">
                                {[
                                  { label: "Total Revenue",    value: formatCurrency(stats.totalRevenue) },
                                  { label: "Total Orders",     value: stats.totalOrders },
                                  { label: "Active Products",  value: stats.activeProducts },
                                  { label: "Total Products",   value: stats.totalProducts },
                                ].map(st => (
                                  <div key={st.label} className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
                                    <p className="text-[16px] font-black text-[#1a1c1c]">{st.value}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/35 mt-1">{st.label}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Details grid */}
                              <div className="grid grid-cols-4 gap-6 mb-5">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-2">Contact</p>
                                  <p className="text-[12px] text-[#1a1c1c]/70">{sd.phone || "Not provided"}</p>
                                  {sd.address && <p className="text-[11px] text-[#1a1c1c]/45 mt-0.5">{sd.address}</p>}
                                  {sd.city && <p className="text-[11px] text-[#1a1c1c]/45">{sd.city}, {sd.pincode}</p>}
                                </div>
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-2">Business Details</p>
                                  <p className="text-[11px] text-[#1a1c1c]/50">PAN: <span className="font-mono">{sd.pan || "—"}</span></p>
                                  <p className="text-[11px] text-[#1a1c1c]/50">GSTIN: <span className="font-mono">{sd.gstin || "—"}</span></p>
                                  <p className="text-[11px] text-[#1a1c1c]/50">Trust Score: {sd.trust_score ?? "—"}</p>
                                  <p className="text-[11px] text-[#1a1c1c]/50">Swadeshi Score: {sd.swadeshi_score ?? "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-2">Bank</p>
                                  <p className="text-[11px] text-[#1a1c1c]/50">A/C: {sd.bank_account_number ? "••••" + sd.bank_account_number.slice(-4) : "Not provided"}</p>
                                  <p className="text-[11px] text-[#1a1c1c]/50">IFSC: <span className="font-mono">{sd.bank_ifsc || "—"}</span></p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-2">Commission Settings</p>
                                  {editingCommissionSellerId === sd.id ? (
                                    <div className="space-y-2 mt-1">
                                      <div className="flex gap-2">
                                        <div className="w-1/2">
                                          <label className="text-[8px] font-black uppercase text-[#1a1c1c]/40 block mb-0.5">Platform %</label>
                                          <input type="number" min="0" max="30" step="0.5" value={editRate} onChange={e => setEditRate(e.target.value)}
                                            className="w-full px-2 py-1 rounded text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-[#fcd020]"
                                            style={{ border: "1px solid rgba(0,0,0,0.1)", background: "white" }} />
                                        </div>
                                        <div className="w-1/2">
                                          <label className="text-[8px] font-black uppercase text-[#1a1c1c]/40 block mb-0.5">Gateway %</label>
                                          <input type="number" min="0" max="10" step="0.1" value={editGatewayRate} onChange={e => setEditGatewayRate(e.target.value)}
                                            className="w-full px-2 py-1 rounded text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-[#fcd020]"
                                            style={{ border: "1px solid rgba(0,0,0,0.1)", background: "white" }} />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-[8px] font-black uppercase text-[#1a1c1c]/40 block mb-0.5">Notes</label>
                                        <input type="text" placeholder="Reason..." value={editNotes} onChange={e => setEditNotes(e.target.value)}
                                          className="w-full px-2 py-1 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-[#fcd020]"
                                          style={{ border: "1px solid rgba(0,0,0,0.1)", background: "white" }} />
                                      </div>
                                      <div className="flex gap-2 pt-1">
                                        <button onClick={() => updateCommission(sd.id)} disabled={savingCommission}
                                          className="px-2.5 py-1 text-[10px] font-black rounded bg-[#1a1c1c] text-white hover:bg-black disabled:opacity-50 cursor-pointer">
                                          {savingCommission ? "Saving..." : "Save"}
                                        </button>
                                        <button onClick={cancelEditingCommission}
                                          className="px-2.5 py-1 text-[10px] font-bold rounded border border-gray-300 hover:bg-gray-100 cursor-pointer">
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : d.commission ? (
                                    <div className="space-y-1">
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-[14px] font-black text-[#1a1c1c]">{d.commission.rate}%</span>
                                        <span className="text-[11px] text-[#1a1c1c]/55">Platform Fee</span>
                                      </div>
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-[12px] font-bold text-[#1a1c1c]/55">{d.commission.gateway_rate}%</span>
                                        <span className="text-[10px] text-[#1a1c1c]/40">Gateway Fee</span>
                                      </div>
                                      <div className="text-[11px] text-green-700 font-bold">
                                        Net: {(100 - d.commission.rate - d.commission.gateway_rate).toFixed(1)}% to seller
                                      </div>
                                      {d.commission.notes && (
                                        <p className="text-[10.5px] text-[#1a1c1c]/40 mt-1 italic font-medium">Note: {d.commission.notes}</p>
                                      )}
                                      <div className="flex gap-2 mt-2">
                                        <button onClick={() => startEditingCommission(sd.id, d.commission)}
                                          className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">
                                          Edit Override
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button onClick={() => resetCommission(sd.id, d.commission!.id)}
                                          className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer">
                                          Reset to Default
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-[11px] text-[#1a1c1c]/40">Using default/global commission rates.</p>
                                      <button onClick={() => startEditingCommission(sd.id, null)}
                                        className="text-[10px] font-bold text-blue-600 hover:underline mt-2 cursor-pointer">
                                        Set Custom Override
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              {sd.description && (
                                <div className="mb-5">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-1">Store Description</p>
                                  <p className="text-[12px] text-[#1a1c1c]/60 leading-relaxed">{sd.description}</p>
                                </div>
                              )}

                              {/* Rejection reason */}
                              {sd.rejection_reason && (
                                <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(220,38,38,0.07)" }}>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-red-600/70 mb-1">Rejection Reason</p>
                                  <p className="text-[12px] text-red-700">{sd.rejection_reason}</p>
                                </div>
                              )}

                              {/* Top products */}
                              {products.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-2">Top Products</p>
                                  <div className="flex flex-wrap gap-2">
                                    {products.slice(0, 8).map(p => (
                                      <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
                                        <span className="text-[11px] font-semibold text-[#1a1c1c]/70 max-w-[150px] truncate">{p.name}</span>
                                        <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-full"
                                          style={STATUS_BG[p.approval_status]
                                            ? { background: STATUS_BG[p.approval_status].bg, color: STATUS_BG[p.approval_status].text }
                                            : { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                                          {p.approval_status}
                                        </span>
                                        <span className="text-[9.5px] text-[#1a1c1c]/35">{formatCurrency(p.price)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })() : (
                          <div className="px-8 py-5 text-[11px] text-[#1a1c1c]/30">Failed to load seller details</div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 text-[10.5px] text-[#1a1c1c]/28 font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
            {filtered.length} of {sellers.length} sellers · Click a row to expand details
          </div>
        )}
      </div>

      {/* Seller Approval Modal */}
      {approvingSellerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 ag-slide-up">
            <h3 className="text-[16px] font-black text-[#1a1c1c] mb-1">Approve Seller Account</h3>
            <p className="text-[12px] text-[#1a1c1c]/50 mb-5 font-semibold">Set the platform and gateway commissions for this seller.</p>
            
            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Platform Fee %</label>
                  <input type="number" min="0" max="30" step="0.5" value={approveRate} onChange={e => setApproveRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                    style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
                </div>
                <div className="w-1/2">
                  <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Gateway Fee %</label>
                  <input type="number" min="0" max="10" step="0.1" value={approveGatewayRate} onChange={e => setApproveGatewayRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                    style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
                </div>
              </div>
              <div>
                <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Commission Notes</label>
                <input type="text" placeholder="e.g., Initial rate set during approval" value={approveNotes} onChange={e => setApproveNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                  style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button onClick={() => submitApproval(true)} disabled={savingApproval}
                className="w-full py-2.5 rounded-xl ag-btn-primary text-[12px] font-black ag-btn disabled:opacity-60 cursor-pointer">
                {savingApproval ? "Processing..." : "Approve with Custom Rate"}
              </button>
              <button onClick={() => submitApproval(false)} disabled={savingApproval}
                className="w-full py-2.5 rounded-xl bg-[#eeeeee] hover:bg-black/5 text-[#1a1c1c] text-[12px] font-black ag-btn disabled:opacity-60 cursor-pointer">
                Approve with Default Rates (No Override)
              </button>
              <button onClick={() => setApprovingSellerId(null)} disabled={savingApproval}
                className="w-full py-2 text-[12px] font-semibold text-[#1a1c1c]/45 hover:bg-black/5 rounded-xl ag-btn transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
