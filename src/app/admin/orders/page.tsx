"use client"

import React, { useEffect, useState } from "react"
import { Search, RefreshCw, Check, ChevronDown, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Order {
  id: string; order_number: string; total: number
  payment_status: string; order_status: string; created_at: string
  users: { email: string } | null; sellers: { business_name: string } | null
}

interface OrderDetail {
  id: string; order_number: string; total: number; subtotal: number
  shipping_cost: number; discount_amount: number; tax?: number
  payment_status: string; order_status: string; created_at: string; confirmed_at: string | null
  payment_id: string | null; notes: string | null
  users: { email: string; full_name: string; phone: string } | null
  sellers: { business_name: string; owner_name: string } | null
  addresses: { name: string; phone: string; address_line1: string; address_line2: string | null; city: string; state: string; pincode: string } | null
  order_items: Array<{ id: string; quantity: number; price: number; total: number; products: { name: string; images: string[]; mode: string; state_code: string } | null }>
}

const ORDER_STATUSES   = ["pending", "processing", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"]
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"]

const STATUS_PILL: Record<string, { background: string; color: string }> = {
  paid:             { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  pending:          { background: "rgba(217,119,6,0.09)",   color: "#b45309" },
  failed:           { background: "rgba(220,38,38,0.09)",   color: "#b91c1c" },
  refunded:         { background: "rgba(100,116,139,0.09)", color: "#475569" },
  delivered:        { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  confirmed:        { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  processing:       { background: "rgba(37,99,235,0.09)",   color: "#1d4ed8" },
  shipped:          { background: "rgba(124,58,237,0.09)",  color: "#6d28d9" },
  out_for_delivery: { background: "rgba(14,165,233,0.09)",  color: "#0284c7" },
  cancelled:        { background: "rgba(220,38,38,0.09)",   color: "#b91c1c" },
}

function Pill({ status }: { status: string }) {
  const s = STATUS_PILL[status] || { background: "rgba(100,116,139,0.09)", color: "#475569" }
  return (
    <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap" style={s}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

export default function OrdersPage() {
  const [orders, setOrders]         = useState<Order[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [filter, setFilter]         = useState("all")
  const [toast, setToast]           = useState("")
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [detail, setDetail]         = useState<Record<string, OrderDetail>>({})
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/orders").then(r => r.json()).then(d => {
      setOrders(d.orders || [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2400) }

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (detail[id]) return
    setLoadingDetail(id)
    const r = await fetch(`/api/admin/orders/${id}`)
    if (r.ok) {
      const d = await r.json()
      setDetail(prev => ({ ...prev, [id]: d.order }))
    }
    setLoadingDetail(null)
  }

  const updateOrder = async (id: string, field: "order_status" | "payment_status", value: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    })
    setOrders(p => p.map(o => o.id === id ? { ...o, [field]: value } : o))
    showToast("Order updated")
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.order_status === filter || o.payment_status === filter
    const q = search.toLowerCase()
    const matchSearch = !q || o.order_number.toLowerCase().includes(q)
      || (o.users?.email || "").toLowerCase().includes(q)
      || (o.sellers?.business_name || "").toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const totalRevenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total, 0)
  const STATUS_TILES = [
    { key: "pending",    label: "Pending"    },
    { key: "processing", label: "Processing" },
    { key: "shipped",    label: "Shipped"    },
    { key: "delivered",  label: "Delivered"  },
    { key: "cancelled",  label: "Cancelled"  },
    { key: "paid",       label: "Paid"       },
    { key: "failed",     label: "Failed"     },
  ]

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
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Orders</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">{orders.length} total · {formatCurrency(totalRevenue)} collected</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Status tiles */}
      <div className="flex flex-wrap gap-3 mb-5 ag-slide-up" style={{ animationDelay: "60ms" }}>
        <button onClick={() => setFilter("all")}
          className="ag-card-stat rounded-xl px-4 py-2.5 ag-btn transition-all"
          style={filter === "all" ? { boxShadow: "0 0 0 2px #fcd020" } : {}}>
          <span className="text-[11px] font-black text-[#1a1c1c]">All ({orders.length})</span>
        </button>
        {STATUS_TILES.map(({ key, label }) => {
          const count = key === "paid" || key === "failed"
            ? orders.filter(o => o.payment_status === key).length
            : orders.filter(o => o.order_status === key).length
          const active = filter === key
          return (
            <button key={key} onClick={() => setFilter(filter === key ? "all" : key)}
              className="ag-card-stat rounded-xl px-4 py-2.5 ag-btn transition-all"
              style={active ? { boxShadow: "0 0 0 2px #fcd020" } : {}}>
              <span className="text-[11px] font-black text-[#1a1c1c] capitalize">{label} ({loading ? "—" : count})</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5 ag-slide-up" style={{ animationDelay: "80ms" }}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1c1c]/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order #, customer email, or seller..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#1a1c1c] placeholder:text-[#1a1c1c]/30 focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
          style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
      </div>

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["","Order #","Customer","Seller","Amount","Payment","Order Status","Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                  <td colSpan={8} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-[12px] text-[#1a1c1c]/30">No orders found</td></tr>
              ) : filtered.map((o, i) => (
                <React.Fragment key={o.id}>
                  <tr className="ag-table-row ag-row-in cursor-pointer"
                    style={{ borderBottom: expanded === o.id ? "none" : "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 30}ms` }}
                    onClick={() => toggleExpand(o.id)}>
                    <td className="px-4 py-3">
                      <ChevronDown size={12} className="text-[#1a1c1c]/25 transition-transform"
                        style={{ transform: expanded === o.id ? "rotate(180deg)" : "" }} />
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1a1c1c] text-[12px]">{o.order_number}</td>
                    <td className="px-4 py-3 text-[11px] text-[#1a1c1c]/55">{o.users?.email || "-"}</td>
                    <td className="px-4 py-3 text-[11px] text-[#1a1c1c]/55">{o.sellers?.business_name || "-"}</td>
                    <td className="px-4 py-3 font-black text-[13px]">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select value={o.payment_status} onChange={e => updateOrder(o.id, "payment_status", e.target.value)}
                        className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-[#fcd020] cursor-pointer border-0 ag-btn"
                        style={STATUS_PILL[o.payment_status] || { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                        {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select value={o.order_status} onChange={e => updateOrder(o.id, "order_status", e.target.value)}
                        className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-[#fcd020] cursor-pointer border-0 ag-btn"
                        style={STATUS_PILL[o.order_status] || { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#1a1c1c]/35">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>

                  {expanded === o.id && (
                    <tr key={`${o.id}-detail`}>
                      <td colSpan={8} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "rgba(252,208,32,0.025)" }}>
                        {loadingDetail === o.id ? (
                          <div className="px-8 py-5 space-y-2">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-3 ag-shimmer rounded" />)}
                          </div>
                        ) : detail[o.id] ? (() => {
                          const d = detail[o.id]
                          const addr = d.addresses
                          return (
                            <div className="px-8 py-5">
                              <div className="grid grid-cols-3 gap-6 mb-5">
                                {/* Customer */}
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-2">Customer</p>
                                  <p className="text-[12px] font-bold text-[#1a1c1c]">{d.users?.full_name || "—"}</p>
                                  <p className="text-[11px] text-[#1a1c1c]/45">{d.users?.email}</p>
                                  <p className="text-[11px] text-[#1a1c1c]/45">{d.users?.phone}</p>
                                </div>
                                {/* Seller */}
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-2">Seller</p>
                                  <p className="text-[12px] font-bold text-[#1a1c1c]">{d.sellers?.business_name || "—"}</p>
                                  <p className="text-[11px] text-[#1a1c1c]/45">{d.sellers?.owner_name}</p>
                                </div>
                                {/* Shipping */}
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-2">Delivery Address</p>
                                  {addr ? (
                                    <p className="text-[11px] text-[#1a1c1c]/70 leading-relaxed">
                                      {addr.name} · {addr.phone}<br />
                                      {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}<br />
                                      {addr.city}, {addr.state} {addr.pincode}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-[#1a1c1c]/30">Not available</p>
                                  )}
                                </div>
                              </div>

                              {/* Order items */}
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28 mb-2">Order Items</p>
                                <div className="space-y-2">
                                  {d.order_items?.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                                      {item.products?.images?.[0] ? (
                                        <img src={item.products.images[0]} alt={item.products.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                      ) : (
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(252,208,32,0.12)" }}>
                                          <Package size={12} className="text-[#725c00]" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-[#1a1c1c] truncate">{item.products?.name || "Product"}</p>
                                        <p className="text-[10px] text-[#1a1c1c]/40">{item.quantity} × {formatCurrency(item.price)} · {item.products?.mode || ""}</p>
                                      </div>
                                      <p className="text-[12px] font-black text-[#1a1c1c]">{formatCurrency(item.total)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Financials */}
                              <div className="mt-4 pt-4 flex gap-8 text-right" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                                <div><p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28">Subtotal</p><p className="text-[12px] font-bold">{formatCurrency(d.subtotal || 0)}</p></div>
                                <div><p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28">Shipping</p><p className="text-[12px] font-bold">{formatCurrency(d.shipping_cost || 0)}</p></div>
                                {d.discount_amount > 0 && <div><p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28">Discount</p><p className="text-[12px] font-bold text-green-600">-{formatCurrency(d.discount_amount)}</p></div>}
                                <div><p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28">Total</p><p className="text-[14px] font-black text-[#1a1c1c]">{formatCurrency(d.total)}</p></div>
                                {d.payment_id && <div><p className="text-[9px] font-black uppercase tracking-widest text-[#1a1c1c]/28">Payment ID</p><p className="text-[10px] font-mono text-[#1a1c1c]/40">{d.payment_id}</p></div>}
                              </div>
                            </div>
                          )
                        })() : (
                          <div className="px-8 py-5 text-[11px] text-[#1a1c1c]/30">Failed to load order details</div>
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
            {filtered.length} of {orders.length} orders · Click a row to expand details
          </div>
        )}
      </div>
    </div>
  )
}
