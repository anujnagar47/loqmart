"use client"

import { useState } from "react"
import type { Product } from "@/types/database"
import { trackMarketplaceEvent } from "@/lib/analyticsTracker"

type CustomizableProduct = Pick<Product, "slug" | "name"> & Partial<Pick<Product, "id" | "mode" | "category">>

export function isFurnitureProduct(product: CustomizableProduct) {
  const details = `${product.name} ${product.slug} ${product.category?.name || ""} ${product.category?.slug || ""}`.toLowerCase()
  return product.mode === "machine_made" || product.slug.startsWith("jfc-") || /furniture|jodhpuri|chair|stool|table|sofa|couch|bed|wardrobe|cabinet|bookshelf|shoe rack|dining|wooden temple|sideboard|dresser/.test(details)
}

export function CustomizationRequest({ product }: { product: CustomizableProduct }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ dimensions: "", finish: "", upholstery: "", quantity: "1", fullName: "", email: "", phone: "", cityState: "" })

  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    const customization = [
      "Customization request",
      `Dimensions: ${form.dimensions || "Not specified"}`,
      `Wood finish / polish: ${form.finish || "Not specified"}`,
      `Fabric / upholstery: ${form.upholstery || "Not specified"}`,
      `Quantity: ${form.quantity}`,
    ].join("\n")
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          cityState: form.cityState,
          note: customization,
          ...(product.id ? { productIds: [product.id], productOptions: { [product.id]: customization.slice(0, 120) } } : { productSlugs: [product.slug] }),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not submit your request. Please try again.")
      trackMarketplaceEvent("customization_inquiry", { productSlug: product.slug })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return <>
    <button type="button" onClick={() => { setOpen(true); setSuccess(false); setError("") }} className="mt-2 w-full rounded-[4px] border border-[#725c00] bg-white px-3 py-2.5 text-xs font-semibold text-[#725c00] hover:bg-[#fffbea]">
      Request Customization
    </button>
    {open && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="customize-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-lg bg-white p-5 shadow-xl sm:rounded-lg sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><h2 id="customize-title" className="text-lg font-bold text-[#1a1c1c]">Request a custom version</h2><p className="mt-1 text-sm text-[#4d4632]">{product.name}</p></div>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded border border-[#d0c6ac] px-2.5 py-1 text-sm">Close</button>
        </div>
        {success ? <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Your customization request has been sent. The seller will follow up with you.</div> : <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[#4d4632]">Custom dimensions<textarea value={form.dimensions} onChange={e => update("dimensions", e.target.value)} placeholder="Width × depth × height, or other measurements" rows={2} className="mt-1 w-full rounded border border-[#d0c6ac] px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-[#4d4632]">Wood finish / polish<textarea value={form.finish} onChange={e => update("finish", e.target.value)} placeholder="Wood type, stain, polish, or finish" rows={2} className="mt-1 w-full rounded border border-[#d0c6ac] px-3 py-2 text-sm" /></label>
          </div>
          <label className="block text-xs font-medium text-[#4d4632]">Fabric / upholstery notes<textarea value={form.upholstery} onChange={e => update("upholstery", e.target.value)} placeholder="Fabric, color, pattern, padding, or upholstery notes" rows={2} className="mt-1 w-full rounded border border-[#d0c6ac] px-3 py-2 text-sm" /></label>
          <label className="block text-xs font-medium text-[#4d4632]">Quantity<input type="number" min="1" max="999" required value={form.quantity} onChange={e => update("quantity", e.target.value)} className="mt-1 w-full rounded border border-[#d0c6ac] px-3 py-2 text-sm" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[#4d4632]">Name<input required minLength={2} value={form.fullName} onChange={e => update("fullName", e.target.value)} className="mt-1 w-full rounded border border-[#d0c6ac] px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-[#4d4632]">Email<input type="email" required value={form.email} onChange={e => update("email", e.target.value)} className="mt-1 w-full rounded border border-[#d0c6ac] px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-[#4d4632]">Phone<input type="tel" required value={form.phone} onChange={e => update("phone", e.target.value)} className="mt-1 w-full rounded border border-[#d0c6ac] px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-[#4d4632]">City / State<input required minLength={2} value={form.cityState} onChange={e => update("cityState", e.target.value)} className="mt-1 w-full rounded border border-[#d0c6ac] px-3 py-2 text-sm" /></label>
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={submitting} className="w-full rounded bg-[#fcd020] px-4 py-3 text-sm font-bold text-[#231b00] disabled:opacity-60">{submitting ? "Sending request…" : "Send customization request"}</button>
        </form>}
      </section>
    </div>}
  </>
}
