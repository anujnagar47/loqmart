"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Phone, MapPin, Send, MessageCircle, AlertCircle, Check } from "lucide-react"

const contactOptions = [
  { icon: Mail,          title: "Email Support",     desc: "support@loqmart.in",    detail: "We reply within 24 hours"          },
  { icon: Phone,         title: "Toll-Free Helpline", desc: "1800-LOQMART",          detail: "Mon–Sat, 9am–6pm IST"              },
  { icon: MessageCircle, title: "WhatsApp",           desc: "+91 9999 999 999",      detail: "Quick queries, Mon–Sat 10am–5pm"   },
  { icon: MapPin,        title: "Registered Office",  desc: "New Delhi, India",      detail: "CIN: U74999DL2024PTC123456"        },
]

const inputCls = "w-full px-4 py-3 rounded-xl text-[13px] outline-none transition-all"
const inputStyle = { border: "1px solid rgba(26,28,28,0.14)", background: "white", color: "#1a1c1c" }
const onFocus = (e: any) => { e.currentTarget.style.borderColor = "#fcd020"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(252,208,32,0.1)" }
const onBlur  = (e: any) => { e.currentTarget.style.borderColor = "rgba(26,28,28,0.14)"; e.currentTarget.style.boxShadow = "none" }

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSent(true) }

  return (
    <div className="min-h-screen" style={{ background: "#eeece8" }}>
      {/* Header */}
      <div className="py-14 px-4 text-center" style={{ background: "#fcd020" }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1c1c]/50 block mb-2">Get in Touch</p>
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#1a1c1c] mb-2">Contact LoqMart</h1>
          <p className="text-[14px] text-[#1a1c1c]/55 max-w-lg mx-auto">
            Buyer, seller, or just curious? We're here to help. Reach us via any channel below.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Contact options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {contactOptions.map((opt, i) => (
            <motion.div key={opt.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(26,28,28,0.08)" }}
              className="bg-white rounded-2xl p-5 text-center"
              style={{ border: "1px solid rgba(26,28,28,0.07)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#fcd020" }}>
                <opt.icon size={20} className="text-[#1a1c1c]" />
              </div>
              <h3 className="font-bold text-[13px] text-[#1a1c1c] mb-1">{opt.title}</h3>
              <p className="font-semibold text-[12px] text-[#725c00] mb-0.5">{opt.desc}</p>
              <p className="text-[10.5px] text-[#1a1c1c]/40">{opt.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* Contact form */}
        <div className="max-w-xl mx-auto">
          <h2 className="text-[22px] font-extrabold text-[#1a1c1c] text-center mb-1">Send a Message</h2>
          <p className="text-[13px] text-[#1a1c1c]/45 text-center mb-6">Fill the form and our team will respond within 24 hours.</p>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" className="bg-white rounded-2xl p-10 text-center"
                style={{ border: "1px solid rgba(26,28,28,0.07)" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(5,150,105,0.1)" }}>
                  <Check size={28} className="text-green-600" />
                </div>
                <h3 className="text-[18px] font-bold text-[#1a1c1c] mb-2">Message Sent!</h3>
                <p className="text-[13px] text-[#1a1c1c]/45">
                  Thank you for reaching out. We'll reply to your email within 24 hours.
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(26,28,28,0.07)" }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Your Name</label>
                      <input className={inputCls} style={{ ...inputStyle, height: "2.75rem" }} placeholder="Arjun Kumar"
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Email Address</label>
                      <input type="email" className={inputCls} style={{ ...inputStyle, height: "2.75rem" }} placeholder="you@example.com"
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Subject</label>
                    <input className={inputCls} style={{ ...inputStyle, height: "2.75rem" }} placeholder="e.g. Order issue, Seller query"
                      value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#1a1c1c]/45 mb-1.5">Message</label>
                    <textarea className={`${inputCls} min-h-[130px] resize-none`} style={inputStyle}
                      placeholder="Describe your issue or question in detail..."
                      value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ background: "rgba(217,119,6,0.07)", border: "1px solid rgba(217,119,6,0.18)" }}>
                    <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    <p className="text-[11px] text-amber-700">
                      For urgent order issues, use the toll-free helpline: <strong>1800-LOQMART</strong>
                    </p>
                  </div>
                  <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-black text-[#1a1c1c]"
                    style={{ background: "#fcd020" }}>
                    <Send size={14} /> Send Message
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
