"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Check, Loader2, MapPin, MessageSquareText, Trash2, X } from "lucide-react"
import { useInquiryStore } from "@/lib/store"

const states: Record<string, string> = { RJ: "Rajasthan", UP: "Uttar Pradesh", MH: "Maharashtra", WB: "West Bengal", KA: "Karnataka", TN: "Tamil Nadu", OD: "Odisha", OR: "Odisha", GJ: "Gujarat", KL: "Kerala", AS: "Assam", JK: "Jammu & Kashmir" }
type InquiryForm = { fullName: string; email: string; phone: string; cityState: string; note: string; website: string }
const emptyForm: InquiryForm = { fullName: "", email: "", phone: "", cityState: "", note: "", website: "" }

export function InquiryPanel({ page = false }: { page?: boolean }) {
  const items = useInquiryStore(s => s.items)
  const open = useInquiryStore(s => s.drawerOpen)
  const close = useInquiryStore(s => s.closeDrawer)
  const remove = useInquiryStore(s => s.removeItem)
  const clear = useInquiryStore(s => s.clear)
  const [form, setForm] = useState(emptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open || page) return
    const old = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close() }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = old; window.removeEventListener("keydown", onKey) }
  }, [open, page, close])

  if (!page && !open) return null

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (!items.length) { setError("Add at least one piece before submitting."); return }
    if (!form.fullName.trim() || !form.cityState.trim()) { setError("Please add your name and city or state."); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError("Enter a valid email address."); return }
    if (!/^[+\d][\d\s()+-]{7,19}$/.test(form.phone.trim())) { setError("Enter a valid phone or WhatsApp number."); return }
    setBusy(true)
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), cityState: form.cityState.trim(), note: form.note.trim(), productIds: items.map(item => item.product_id), productOptions: Object.fromEntries(items.filter(item => item.requested_option).map(item => [item.product_id, item.requested_option])), website: form.website }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "We could not submit your inquiry. Please try again.")
      clear(); setSubmitted(true); setFormOpen(false); setForm(emptyForm)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not submit your inquiry. Please try again.")
    } finally { setBusy(false) }
  }

  const content = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-start justify-between border-b border-[#E5E7EB] px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#725c00]">LoqMart curation desk</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#1a1c1c]">{submitted ? "Inquiry received" : "My selected pieces"}</h2>
          {!submitted && <p className="mt-1 text-sm text-[#4d4632]">{items.length} {items.length === 1 ? "piece" : "pieces"} saved for an availability check</p>}
        </div>
        {!page && <button onClick={close} aria-label="Close inquiry panel" className="rounded-md p-2 text-[#4d4632] hover:bg-[#f3f3f3]"><X size={20} /></button>}
      </div>

      {submitted ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-[#fcd020]"><Check size={27} className="text-[#231b00]" /></div>
          <h3 className="text-2xl font-semibold tracking-tight text-[#1a1c1c]">Inquiry Received</h3>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#4d4632]">Thank you for your interest in India’s authentic heritage crafts. Our curation team will review product availability with the artisan cluster and get back to you shortly via WhatsApp and email.</p>
          <Link href="/category" onClick={() => { setSubmitted(false); if (!page) close() }} className="mt-7 inline-flex items-center gap-2 rounded-md bg-[#fcd020] px-5 py-3 text-sm font-semibold text-[#231b00] hover:bg-[#eab308]">Continue Exploring Collections <ArrowRight size={16} /></Link>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <MessageSquareText size={32} className="text-[#725c00]" />
          <h3 className="mt-4 text-lg font-semibold text-[#1a1c1c]">Your inquiry list is empty</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#4d4632]">Save pieces you would like us to check with their artisan or seller.</p>
          <Link href="/category" onClick={() => { if (!page) close() }} className="mt-5 rounded-md bg-[#fcd020] px-4 py-2.5 text-sm font-semibold text-[#231b00] hover:bg-[#eab308]">Explore collections</Link>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ul className="divide-y divide-[#E5E7EB]">
              {items.map(item => (
                <li key={item.product_id} className="flex gap-4 py-4 first:pt-0">
                  <Link href={`/product/${item.slug}`} onClick={() => { if (!page) close() }} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-[#f3f3f3]">
                    {item.images[0] && <Image src={item.images[0]} alt={item.name} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${item.slug}`} onClick={() => { if (!page) close() }} className="line-clamp-2 text-sm font-semibold text-[#1a1c1c] hover:underline">{item.name}</Link>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#4d4632]">{item.state_code && <><MapPin size={12} />{states[item.state_code] || item.state_code}</>}<span>{item.mode === "handmade" ? "Handcrafted" : "Contemporary crafted"}</span></p>
                    {item.seller_name && <p className="mt-1 truncate text-xs text-[#4d4632]">{item.seller_name}</p>}
                    {item.requested_option && <p className="mt-1 text-xs text-[#4d4632]">Selected option: {item.requested_option}</p>}
                    <button onClick={() => remove(item.product_id)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#4d4632] hover:text-red-700"><Trash2 size={13} />Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            {!formOpen && <button onClick={() => setFormOpen(true)} className="mt-4 w-full rounded-md bg-[#fcd020] px-4 py-3 text-sm font-semibold text-[#231b00] transition-colors hover:bg-[#eab308]">Submit Inquiry for Availability</button>}
            {formOpen && (
              <form onSubmit={submit} className="mt-5 space-y-3 rounded-md border border-[#E5E7EB] p-4">
                <div><h3 className="font-semibold text-[#1a1c1c]">Where should we send availability updates?</h3><p className="mt-1 text-xs text-[#4d4632]">Our team will contact you about these selected pieces.</p></div>
                <input autoComplete="name" required maxLength={120} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" className="w-full rounded-md border border-[#d0c6ac] px-3 py-2.5 text-sm outline-none focus:border-[#725c00]" />
                <input autoComplete="email" type="email" required maxLength={254} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="w-full rounded-md border border-[#d0c6ac] px-3 py-2.5 text-sm outline-none focus:border-[#725c00]" />
                <input autoComplete="tel" type="tel" required maxLength={20} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone / WhatsApp" className="w-full rounded-md border border-[#d0c6ac] px-3 py-2.5 text-sm outline-none focus:border-[#725c00]" />
                <input required maxLength={120} value={form.cityState} onChange={e => setForm({ ...form, cityState: e.target.value })} placeholder="City / State" className="w-full rounded-md border border-[#d0c6ac] px-3 py-2.5 text-sm outline-none focus:border-[#725c00]" />
                <textarea maxLength={1000} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Optional note or special request" rows={3} className="w-full resize-y rounded-md border border-[#d0c6ac] px-3 py-2.5 text-sm outline-none focus:border-[#725c00]" />
                <label className="hidden" aria-hidden="true">Leave this field empty<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></label>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <div className="flex gap-2"><button type="button" onClick={() => { setFormOpen(false); setError("") }} className="flex-1 rounded-md border border-[#d0c6ac] px-3 py-2.5 text-sm font-medium text-[#1a1c1c]">Back</button><button disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#fcd020] px-3 py-2.5 text-sm font-semibold text-[#231b00] hover:bg-[#eab308] disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Submitting" : "Send inquiry"}</button></div>
              </form>
            )}
          </div>
        </>
      )}
      {!submitted && items.length > 0 && <div className="border-t border-[#E5E7EB] px-5 py-3 text-xs leading-5 text-[#4d4632]">No payment is taken here. We will confirm availability with the seller.</div>}
    </div>
  )

  if (page) return <section className="mx-auto my-8 min-h-[70vh] max-w-3xl overflow-hidden rounded-lg border border-[#E5E7EB] shadow-sm">{content}</section>
  return <div className="fixed inset-0 z-[80]">
    <button aria-label="Close inquiry panel" onClick={close} className="absolute inset-0 bg-black/35" />
    <aside role="dialog" aria-modal="true" aria-label="My selected pieces" className="absolute inset-y-0 right-0 w-full max-w-md shadow-2xl">{content}</aside>
  </div>
}
