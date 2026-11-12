"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, MapPin, Send, AlertCircle, Check } from "lucide-react"

// Phone/WhatsApp support and the company's CIN are deliberately omitted
// until real values exist — an honest gap beats a fabricated number.
const contactOptions = [
  { icon: Mail,   title: "Email Support",    desc: "support@loqmart.in", detail: "We reply within 24 hours" },
  { icon: MapPin, title: "Registered Office", desc: "New Delhi, India",   detail: "" },
]

const inputCls = "w-full px-4 py-3 rounded-xl text-[13px] outline-none transition-all"
const inputStyle = { border: "1px solid rgba(17,24,39,0.14)", background: "white", color: "#111827" }
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = "#FACC15"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(250,204,21,0.1)" }
const onBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = "rgba(17,24,39,0.14)"; e.currentTarget.style.boxShadow = "none" }

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to send your message. Please try again.")
        return
      }
      setSent(true)
    } catch {
      setError("Failed to send your message. Please check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#FBF9F5" }}>
      {/* Header */}
      <div className="py-14 px-4 text-center" style={{ background: "#FACC15" }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111827]/50 block mb-2">Get in Touch</p>
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#111827] mb-2">Contact LoqMart</h1>
          <p className="text-[14px] text-[#111827]/55 max-w-lg mx-auto">
            Buyer, seller, or just curious? We&apos;re here to help. Reach us via any channel below.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 max-w-md mx-auto">
          {contactOptions.map((opt, i) => (
            <motion.div key={opt.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}
              className="bg-white rounded-2xl p-5 text-center"
              style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#FACC15" }}>
                <opt.icon size={20} className="text-[#111827]" />
              </div>
              <h3 className="font-bold text-[13px] text-[#111827] mb-1">{opt.title}</h3>
              <p className="font-semibold text-[12px] text-[#111827] mb-0.5">{opt.desc}</p>
              {opt.detail && <p className="text-[10.5px] text-[#111827]/40">{opt.detail}</p>}
            </motion.div>
          ))}
        </div>

        {/* Contact form */}
        <div className="max-w-xl mx-auto">
          <h2 className="text-[22px] font-extrabold text-[#111827] text-center mb-1">Send a Message</h2>
          <p className="text-[13px] text-[#111827]/45 text-center mb-6">Fill the form and our team will respond within 24 hours.</p>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" className="bg-white rounded-2xl p-10 text-center"
                style={{ border: "1px solid rgba(17,24,39,0.07)" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(5,150,105,0.1)" }}>
                  <Check size={28} className="text-green-600" />
                </div>
                <h3 className="text-[18px] font-bold text-[#111827] mb-2">Message Sent!</h3>
                <p className="text-[13px] text-[#111827]/45">
                  Thank you for reaching out. We&apos;ll reply to your email within 24 hours.
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(17,24,39,0.07)" }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#111827]/45 mb-1.5">Your Name</label>
                      <input className={inputCls} style={{ ...inputStyle, height: "2.75rem" }} placeholder="Arjun Kumar"
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#111827]/45 mb-1.5">Email Address</label>
                      <input type="email" className={inputCls} style={{ ...inputStyle, height: "2.75rem" }} placeholder="you@example.com"
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#111827]/45 mb-1.5">Subject</label>
                    <input className={inputCls} style={{ ...inputStyle, height: "2.75rem" }} placeholder="e.g. Order issue, Seller query"
                      value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#111827]/45 mb-1.5">Message</label>
                    <textarea className={`${inputCls} min-h-[130px] resize-none`} style={inputStyle}
                      placeholder="Describe your issue or question in detail..."
                      value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ background: "rgba(217,119,6,0.07)", border: "1px solid rgba(217,119,6,0.18)" }}>
                    <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    <p className="text-[11px] text-amber-700">
                      For urgent order issues, mention your order number and we&apos;ll prioritize your email.
                    </p>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl"
                      style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                      <AlertCircle size={14} className="text-red-600 shrink-0" />
                      <p className="text-[11px] text-red-700">{error}</p>
                    </div>
                  )}
                  <motion.button type="submit" disabled={submitting} whileHover={{ scale: submitting ? 1 : 1.01 }} whileTap={{ scale: submitting ? 1 : 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-black text-[#111827] disabled:opacity-50"
                    style={{ background: "#FACC15" }}>
                    <Send size={14} /> {submitting ? "Sending…" : "Send Message"}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
