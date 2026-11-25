"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { cartItemPrice, formatCurrency } from "@/lib/utils"

type Contact = { fullName: string; email: string; phone: string; cityState: string; note: string }
const emptyContact: Contact = { fullName: "", email: "", phone: "", cityState: "", note: "" }

export default function CheckoutPage() {
  const items = useCartStore(state => state.items)
  const clearCart = useCartStore(state => state.clearCart)
  const [contact, setContact] = useState(emptyContact)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const subtotal = items.reduce((sum, item) => sum + cartItemPrice(item) * item.quantity, 0)
  const productIds = [...new Set(items.map(item => item.product_id))]

  async function submitPurchaseRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (items.length === 0) return setError("Your cart is empty. Add a product before sending a request.")
    if (productIds.length > 20) return setError("A request can include up to 20 different products. Remove a few products and try again.")
    setBusy(true)
    const productOptions = Object.fromEntries(productIds.map(id => {
      const lines = items.filter(item => item.product_id === id)
      return [id, lines.map(item => `${item.quantity} × ${item.variant_name || "Standard"}`).join(", ")]
    }))
    const cartDetails = items.map(item => `${item.product?.name || "Product"} — quantity ${item.quantity}${item.variant_name ? ` (${item.variant_name})` : ""}`).join("\n")
    const note = ["Purchase request from checkout. No payment was collected.", cartDetails, contact.note.trim()].filter(Boolean).join("\n\n").slice(0, 1000)
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: contact.fullName.trim(), email: contact.email.trim(), phone: contact.phone.trim(),
          cityState: contact.cityState.trim(), note, productIds, productOptions,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "We could not send your request. Please try again.")
      clearCart()
      setSubmitted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not send your request. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (submitted) return <main className="min-h-[70vh] bg-[#f8f7f2] px-4 py-16"><section className="mx-auto max-w-xl rounded-lg border border-[#d0c6ac] bg-white p-8 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fcd020]/35 text-[#725c00]"><Check size={24}/></span><p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#725c00]">Purchase request sent</p><h1 className="mt-2 text-2xl font-black tracking-tight text-[#1a1c1c]">We’ll be in touch soon</h1><p className="mt-3 text-sm leading-6 text-[#4d4632]">Your selected products have been sent to the LoqMart team. We’ll confirm availability and next steps using the contact details you provided. No payment has been taken.</p><Link href="/category" className="mt-6 inline-flex items-center gap-2 rounded bg-[#fcd020] px-5 py-3 text-sm font-bold text-[#231b00]">Continue browsing <ArrowRight size={16}/></Link></section></main>

  if (!items.length) return <main className="mx-auto my-16 max-w-xl px-4 text-center"><h1 className="text-2xl font-bold text-[#1a1c1c]">Your cart is empty</h1><p className="mt-2 text-sm text-[#4d4632]">Add products to your cart to send a purchase request.</p><Link className="mt-5 inline-flex rounded bg-[#fcd020] px-5 py-3 text-sm font-bold text-[#231b00]" href="/category">Browse products</Link></main>

  return <main className="min-h-[70vh] bg-[#f8f7f2] px-4 py-8 pb-20 sm:px-6">
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-widest text-[#725c00]">Checkout is opening soon</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1a1c1c]">Send us your purchase request</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4d4632]">Our secure payment gateway is not connected yet. You can still tell us which products you want; the LoqMart team will check availability and contact you. This request is not an order, does not reserve stock, and does not collect payment.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-[#d0c6ac] bg-white p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-2"><ShieldCheck size={19} className="text-[#725c00]"/><h2 className="font-bold text-[#1a1c1c]">Your contact details</h2></div>
          <form onSubmit={submitPurchaseRequest} className="space-y-3">
            <input required autoComplete="name" maxLength={120} value={contact.fullName} onChange={e=>setContact({...contact,fullName:e.target.value})} placeholder="Full name" className="min-h-11 w-full rounded border border-[#d0c6ac] px-3 text-sm"/>
            <input required type="email" autoComplete="email" maxLength={254} value={contact.email} onChange={e=>setContact({...contact,email:e.target.value})} placeholder="Email address" className="min-h-11 w-full rounded border border-[#d0c6ac] px-3 text-sm"/>
            <input required type="tel" autoComplete="tel" maxLength={20} value={contact.phone} onChange={e=>setContact({...contact,phone:e.target.value})} placeholder="Phone or WhatsApp number" className="min-h-11 w-full rounded border border-[#d0c6ac] px-3 text-sm"/>
            <input required autoComplete="address-level2" maxLength={120} value={contact.cityState} onChange={e=>setContact({...contact,cityState:e.target.value})} placeholder="City and state" className="min-h-11 w-full rounded border border-[#d0c6ac] px-3 text-sm"/>
            <textarea maxLength={700} rows={3} value={contact.note} onChange={e=>setContact({...contact,note:e.target.value})} placeholder="Optional note" className="w-full rounded border border-[#d0c6ac] px-3 py-2.5 text-sm"/>
            {error&&<p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <button disabled={busy||productIds.length>20} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-[#fcd020] px-5 text-sm font-black text-[#231b00] disabled:opacity-60">{busy&&<Loader2 size={17} className="animate-spin"/>}{busy?"Sending request…":"Send purchase request"}<ArrowRight size={16}/></button>
            <p className="text-center text-xs text-[#4d4632]">No payment is taken. Your details are used to respond to this request.</p>
          </form>
        </section>
        <aside className="h-fit rounded-lg border border-[#d0c6ac] bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-bold text-[#1a1c1c]">Selected catalog</h2>
          <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">{items.map(item=><div key={item.id} className="flex items-center gap-3 border-b border-[#eeeeee] pb-3 last:border-0"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-[#f3f3f3]">{item.product?.images?.[0]&&<Image src={item.product.images[0]} alt={item.product.name} fill sizes="56px" className="object-contain"/>}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold text-[#1a1c1c]">{item.product?.name||"Product"}</p><p className="text-xs text-[#4d4632]">Qty {item.quantity}{item.variant_name?` · ${item.variant_name}`:""}</p></div><span className="shrink-0 text-xs font-semibold">{formatCurrency(cartItemPrice(item)*item.quantity)}</span></div>)}</div>
          <div className="mt-3 flex justify-between border-t border-[#d0c6ac] pt-4 text-sm"><span>Catalog value estimate</span><strong>{formatCurrency(subtotal)}</strong></div>
          <p className="mt-2 text-xs leading-5 text-[#4d4632]">Estimate only. The final price, stock and delivery details will be confirmed by our team.</p>
          {productIds.length>20&&<p className="mt-3 text-xs font-semibold text-red-700">This request supports up to 20 different products. Remove products from the cart to continue.</p>}
          <Link href="/wishlist" className="mt-4 inline-flex min-h-11 items-center text-xs font-bold text-[#725c00] underline">Review your wishlist</Link>
        </aside>
      </div>
    </div>
  </main>
}
