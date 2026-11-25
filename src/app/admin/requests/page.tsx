"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Mail, MessageSquare, RefreshCw, Search, ShoppingBag } from "lucide-react"

type RequestedProduct = { id: string; name: string; slug: string; images: string[]; state_code: string | null; sellerName: string | null; option: string }
type PurchaseRequest = { id: string; fullName: string; email: string; phone: string; cityState: string; note: string | null; status: string; createdAt: string; products: RequestedProduct[] }

const statusClass: Record<string, string> = { new: "bg-amber-50 text-amber-800", contacted: "bg-sky-50 text-sky-800", closed: "bg-stone-100 text-stone-700" }

export default function AdminPurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/admin/inquiries", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Could not load purchase requests.")
      setRequests(payload.requests || [])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load purchase requests.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    setError("")
    try {
      const response = await fetch("/api/admin/inquiries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Could not update request status.")
      setRequests(current => current.map(request => request.id === id ? { ...request, status } : request))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update request status.")
    } finally { setUpdating(null) }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return requests
    return requests.filter(request => [request.fullName, request.email, request.phone, request.cityState, ...request.products.map(product => product.name)].some(value => value?.toLowerCase().includes(query)))
  }, [requests, search])

  return <div className="p-4 sm:p-7">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#725c00]">Customer demand</p><h1 className="mt-1 text-2xl font-black tracking-tight text-[#1a1c1c]">Purchase requests</h1><p className="mt-1 text-sm text-[#4d4632]">Products buyers selected before secure checkout opens.</p></div><button type="button" onClick={()=>void load()} aria-label="Refresh purchase requests" className="inline-flex min-h-11 items-center gap-2 rounded border border-[#d0c6ac] bg-white px-3 text-sm font-semibold"><RefreshCw size={15} className={loading?"animate-spin":""}/>Refresh</button></header>
    <div className="mb-4 flex items-center gap-2 rounded border border-[#d0c6ac] bg-white px-3"><Search size={16} className="shrink-0 text-[#4d4632]"/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search customer, phone, location, or product" className="min-h-11 w-full bg-transparent text-sm outline-none"/></div>
    {error&&<p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {loading?<div className="rounded border border-[#d0c6ac] bg-white p-10 text-center text-sm text-[#4d4632]">Loading purchase requests…</div>:filtered.length===0?<div className="rounded border border-dashed border-[#d0c6ac] bg-white p-10 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-[#725c00]"/><h2 className="mt-3 font-bold text-[#1a1c1c]">{requests.length?"No matching requests":"No purchase requests yet"}</h2><p className="mt-1 text-sm text-[#4d4632]">Requests submitted at checkout will appear here.</p></div>:<div className="space-y-4">{filtered.map(request=><article key={request.id} className="rounded border border-[#d0c6ac] bg-white p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-[#1a1c1c]">{request.fullName}</h2><p className="mt-1 text-xs text-[#4d4632]">{request.cityState} · {new Date(request.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"><a href={`mailto:${request.email}`} className="inline-flex items-center gap-1 text-[#725c00] underline"><Mail size={13}/>{request.email}</a><a href={`tel:${request.phone.replace(/[^+\d]/g,"")}`} className="inline-flex items-center gap-1 text-[#725c00] underline"><MessageSquare size={13}/>{request.phone}</a></div></div><label className="text-xs font-semibold text-[#4d4632]">Status<select value={request.status} disabled={updating===request.id} onChange={event=>void updateStatus(request.id,event.target.value)} className={`ml-2 min-h-10 rounded border border-[#d0c6ac] px-2 ${statusClass[request.status]||"bg-white"}`}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></label></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{request.products.map(product=><div key={product.id} className="flex items-center gap-3 rounded border border-[#eeeeee] p-2"><div className="relative h-12 w-12 shrink-0 bg-white">{product.images?.[0]&&<Image src={product.images[0]} alt="" fill sizes="48px" className="object-contain"/>}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-[#1a1c1c]">{product.name}</p><p className="truncate text-[11px] text-[#4d4632]">{product.option||"Selected product"}{product.state_code?` · ${product.state_code}`:""}</p>{product.sellerName&&<p className="truncate text-[11px] text-[#4d4632]">{product.sellerName}</p>}</div></div>)}</div>
      {request.note&&<p className="mt-3 whitespace-pre-line rounded bg-[#f8f7f2] p-3 text-xs leading-5 text-[#4d4632]">{request.note}</p>}</article>)}</div>}
  </div>
}
