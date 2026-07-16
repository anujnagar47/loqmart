"use client"

import { useEffect, useState } from "react"
import { Check, RefreshCw, Send, Trash2, Bell } from "lucide-react"

interface Notification {
  id: string; user_id: string; type: string; title: string; message: string
  is_read: boolean; created_at: string
  users: { email: string; full_name: string } | null
}

const NOTIF_TYPES = [
  { value: "admin_broadcast", label: "Broadcast" },
  { value: "order_confirmed", label: "Order Confirmed" },
  { value: "order_update",    label: "Order Update" },
  { value: "seller_update",   label: "Seller Update" },
  { value: "promotion",       label: "Promotion" },
  { value: "system",          label: "System" },
]

const EMPTY_FORM = { target: "all", role: "buyer", type: "admin_broadcast", title: "", message: "" }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]             = useState(true)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [sending, setSending]             = useState(false)
  const [toast, setToast]                 = useState("")

  const load = () => {
    setLoading(true)
    fetch("/api/admin/notifications").then(r => r.json()).then(d => {
      setNotifications(d.notifications || [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2600) }

  const send = async () => {
    if (!form.title || !form.message) { showToast("Title and message required"); return }
    setSending(true)
    const r = await fetch("/api/admin/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    const d = await r.json()
    if (d.error) showToast(d.error)
    else { showToast(`Sent to ${d.sent} user${d.sent === 1 ? "" : "s"}`); setForm(EMPTY_FORM); load() }
    setSending(false)
  }

  const deleteNotif = async (id: string) => {
    await fetch("/api/admin/notifications", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    })
    setNotifications(p => p.filter(n => n.id !== id))
    showToast("Deleted")
  }

  const readCount = notifications.filter(n => n.is_read).length
  const unreadCount = notifications.length - readCount

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
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Notifications</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">{notifications.length} total · {unreadCount} unread</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
        {/* Broadcast form */}
        <div className="ag-card rounded-2xl p-5 self-start ag-slide-up" style={{ border: "1px solid rgba(252,208,32,0.2)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Send size={13} className="text-[#725c00]" />
            <h2 className="text-[13px] font-black text-[#1a1c1c]">Broadcast Message</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/40 block mb-1.5">Target Audience</label>
              <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)" }}>
                <option value="all">All Users</option>
                <option value="sellers">All Approved Sellers</option>
                <option value="role">Specific Role</option>
              </select>
            </div>

            {form.target === "role" && (
              <div>
                <label className="text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/40 block mb-1.5">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                  style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)" }}>
                  <option value="buyer">Buyers</option>
                  <option value="seller">Sellers</option>
                  <option value="sub_admin">Sub-Admins</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/40 block mb-1.5">Notification Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)" }}>
                {NOTIF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/40 block mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Short, clear headline..."
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)" }} />
            </div>

            <div>
              <label className="text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/40 block mb-1.5">Message *</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={4} placeholder="Full notification message..."
                className="w-full px-3 py-2 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)" }} />
            </div>

            <button onClick={send} disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-2.5 ag-btn-primary text-[12px] font-black rounded-xl ag-btn disabled:opacity-60">
              <Send size={12} /> {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>

        {/* Recent notifications */}
        <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <Bell size={12} className="text-[#1a1c1c]/40" />
            <h2 className="text-[13px] font-black text-[#1a1c1c]">Recent Notifications</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  {["Recipient","Type","Title","Message","Time",""].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(6)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <td colSpan={6} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
                  </tr>
                )) : notifications.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-[12px] text-[#1a1c1c]/30">No notifications sent yet</td></tr>
                ) : notifications.map((n, i) => (
                  <tr key={n.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 20}ms` }}>
                    <td className="px-5 py-3">
                      <p className="text-[12px] font-bold text-[#1a1c1c]">{n.users?.full_name || "Unknown"}</p>
                      <p className="text-[10px] text-[#1a1c1c]/35">{n.users?.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(114,92,0,0.09)", color: "#725c00" }}>
                        {n.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-[12px] text-[#1a1c1c] max-w-[150px]">
                      <p className="truncate">{n.title}</p>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/45 max-w-[200px]">
                      <p className="truncate">{n.message}</p>
                    </td>
                    <td className="px-5 py-3 text-[10px] text-[#1a1c1c]/30 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => deleteNotif(n.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                        style={{ background: "rgba(220,38,38,0.06)", color: "#ef4444" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.14)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.06)"}>
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {notifications.length > 0 && (
            <div className="px-5 py-3 text-[10.5px] text-[#1a1c1c]/25 font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
              {notifications.length} notifications · {unreadCount} unread · {readCount} read
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
