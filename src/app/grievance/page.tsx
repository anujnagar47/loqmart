"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Send, CheckCircle, Mail } from "lucide-react"

const inputCls = "w-full h-11 px-4 rounded-xl text-[13px] outline-none transition-all"
const inputStyle = { border: "1px solid rgba(26,28,28,0.14)", background: "white", color: "#1a1c1c" }
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = "#fcd020"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(252,208,32,0.1)" }
const onBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = "rgba(26,28,28,0.14)"; e.currentTarget.style.boxShadow = "none" }

export default function GrievancePage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", orderNumber: "", issue: "order",
    description: "", preferredContact: "email",
  })
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to register your grievance. Please try again.")
        return
      }
      setTicketId(data.ticket_number)
      setSubmitted(true)
    } catch {
      setError("Failed to register your grievance. Please check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#eeece8" }}>
      {/* Header */}
      <div className="py-14 px-4 text-center" style={{ background: "#fcd020" }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1c1c]/50 block mb-2">Customer Protection</p>
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#1a1c1c] mb-2">Grievance Redressal</h1>
          <p className="text-[14px] text-[#1a1c1c]/55 max-w-xl mx-auto">
            LoqMart is committed to resolving buyer and seller concerns within the timelines mandated by the Consumer Protection Act, 2019 and e-commerce rules.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Info sidebar */}
          <div className="space-y-5">
            <motion.div className="bg-white rounded-2xl p-6"
              style={{ border: "1px solid rgba(26,28,28,0.07)" }}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="font-extrabold text-[#1a1c1c] mb-4 text-[15px]">Nodal Officer</h2>
              <p className="text-[13px] font-bold text-[#1a1c1c]">LoqMart Grievance Desk</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[12px] text-[#1a1c1c]/55">
                  <Mail className="w-4 h-4 text-[#1a1c1c]/40" />
                  <span>grievance@loqmart.in</span>
                </div>
              </div>
              <p className="text-[11px] text-[#1a1c1c]/40 mt-4 pt-4"
                style={{ borderTop: "1px solid rgba(26,28,28,0.07)" }}>
                Available Mon–Fri, 10am–5pm IST. Responses within 48 hours per Consumer Protection (E-Commerce) Rules 2020.
              </p>
            </motion.div>

            <motion.div className="rounded-2xl p-6"
              style={{ background: "#fef3c7", border: "1px solid rgba(217,119,6,0.2)" }}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
              <h3 className="font-bold text-amber-900 mb-2 text-[13px]">Escalation</h3>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                If your grievance is not resolved within 30 days, you may approach the National Consumer Disputes Redressal Commission (NCDRC) or file a complaint on the CORE portal.
              </p>
            </motion.div>

            <motion.div className="bg-white rounded-2xl p-6"
              style={{ border: "1px solid rgba(26,28,28,0.07)" }}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="font-bold text-[#1a1c1c] mb-4 text-[13px]">Resolution Timelines</h3>
              <div className="space-y-2.5 text-[11px]">
                {[
                  ["Acknowledgement",       "48 hours"         ],
                  ["Resolution",            "15 working days"  ],
                  ["Refund (if applicable)", "5–7 business days"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[#1a1c1c]/50">{label}</span>
                    <span className="font-bold text-[#1a1c1c]">{val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="bg-white rounded-2xl p-12 text-center"
                  style={{ border: "1px solid rgba(26,28,28,0.07)" }}>
                  <motion.div
                    initial={{ scale: 0.6 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: "rgba(5,150,105,0.1)" }}>
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <h2 className="text-[22px] font-extrabold text-[#1a1c1c] mb-2">Grievance Registered</h2>
                  <p className="text-[13px] text-[#1a1c1c]/50 mb-6">
                    Your complaint has been registered. Our Nodal Officer will respond within 48 hours.
                  </p>
                  <div className="inline-block px-6 py-4 rounded-xl" style={{ background: "#eeece8" }}>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/40 mb-1">Your Ticket ID</p>
                    <p className="text-[28px] font-black" style={{ color: "#725c00" }}>{ticketId}</p>
                    <p className="text-[11px] text-[#1a1c1c]/40 mt-1">Save this for follow-up</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="form"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl p-8"
                  style={{ border: "1px solid rgba(26,28,28,0.07)" }}>
                  <h2 className="text-[18px] font-extrabold text-[#1a1c1c] mb-6">File a Complaint</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Full Name *</label>
                        <input className={inputCls} style={inputStyle} placeholder="Full name"
                          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Email *</label>
                        <input type="email" className={inputCls} style={inputStyle} placeholder="Email address"
                          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Phone</label>
                        <input className={inputCls} style={inputStyle} placeholder="+91 mobile number"
                          value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Order Number</label>
                        <input className={inputCls} style={inputStyle} placeholder="Order number (if applicable)"
                          value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })}
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Issue Category *</label>
                      <select className={inputCls} style={inputStyle} value={form.issue}
                        onChange={e => setForm({ ...form, issue: e.target.value })}
                        onFocus={onFocus} onBlur={onBlur}>
                        <option value="order">Order not delivered / delayed</option>
                        <option value="wrong">Wrong item received</option>
                        <option value="quality">Quality issue / defective product</option>
                        <option value="refund">Refund not received</option>
                        <option value="seller">Seller misconduct or fraud</option>
                        <option value="payment">Payment issue</option>
                        <option value="account">Account or login issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Describe Your Complaint *</label>
                      <textarea
                        className="w-full min-h-[140px] px-4 py-3 rounded-xl text-[13px] outline-none resize-none transition-all"
                        style={{ ...inputStyle, minHeight: "140px" }}
                        placeholder="Please describe your issue in detail, including dates, order numbers, and what resolution you are seeking..."
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        required
                        onFocus={onFocus} onBlur={onBlur}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-2">Preferred Contact Method</label>
                      <div className="flex gap-4">
                        {["email", "phone"].map((method) => (
                          <label key={method} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="contactMethod" value={method}
                              checked={form.preferredContact === method}
                              onChange={() => setForm({ ...form, preferredContact: method })}
                              className="w-4 h-4 accent-[#fcd020]" />
                            <span className="text-[13px] text-[#1a1c1c]/60 capitalize">{method}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl"
                        style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <p className="text-[11px] text-red-700">{error}</p>
                      </div>
                    )}

                    <motion.button type="submit" disabled={submitting} whileHover={{ scale: submitting ? 1 : 1.01 }} whileTap={{ scale: submitting ? 1 : 0.97 }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-black text-[#1a1c1c] disabled:opacity-50"
                      style={{ background: "#fcd020" }}>
                      <Send size={14} /> {submitting ? "Submitting…" : "Submit Grievance"}
                    </motion.button>

                    <p className="text-[11px] text-[#1a1c1c]/35 text-center">
                      By submitting, you confirm the information is accurate. False complaints may lead to account suspension.
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
