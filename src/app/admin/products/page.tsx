"use client"

import { useEffect, useState } from "react"
import { Check, X, Search, RefreshCw, Star, Trash2, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { FileUploadZone } from "@/components/ui/file-upload-zone"

interface Product {
  id: string; name: string; price: number; mode: string
  state_code: string | null; tags: string[]; approval_status: string; is_featured: boolean
  created_at: string; seller_id: string | null
}
interface Seller   { id: string; business_name: string; state_code: string }
interface Category { id: string; name: string }

const EMPTY_FORM = { name: "", description: "", price: "", mrp: "", stock: "0", mode: "handmade", state_code: "", seller_id: "", category_id: "", images: [] as string[] }
const STATES = ["AN","AP","AR","AS","BR","CH","CG","DD","DL","DN","GA","GJ","HP","HR","JH","JK","KA","KL","LA","LD","MH","ML","MN","MP","MZ","NL","OD","PB","PY","RJ","SK","TG","TN","TR","UP","UT","WB"]

const STATUS_PILL: Record<string, { background: string; color: string }> = {
  approved: { background: "rgba(22,163,74,0.09)",  color: "#15803d" },
  pending:  { background: "rgba(217,119,6,0.09)",  color: "#b45309" },
  rejected: { background: "rgba(220,38,38,0.09)",  color: "#b91c1c" },
}

export default function ProductsPage() {
  const [products, setProducts]     = useState<Product[]>([])
  const [sellers, setSellers]       = useState<Seller[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [filter, setFilter]         = useState("all")
  const [toast, setToast]           = useState("")
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/admin/products?status=all").then(r => r.json()),
      fetch("/api/admin/sellers").then(r => r.json()),
      fetch("/api/admin/categories").then(r => r.json()),
    ]).then(([p, s, c]) => {
      setProducts(p.products || [])
      setSellers(s.sellers || [])
      setCategories(c.categories || [])
      setLoading(false)
    })
  }
  useEffect(loadAll, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500) }

  const createProduct = async () => {
    if (!form.name || !form.price || !form.seller_id) { showToast("Name, price, seller required"); return }
    setSaving(true)
    const r = await fetch("/api/admin/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price), mrp: form.mrp ? Number(form.mrp) : null, stock: Number(form.stock), category_id: form.category_id || null }),
    })
    const d = await r.json()
    if (d.product) { setProducts(p => [d.product, ...p]); showToast("Product created"); setShowForm(false); setForm(EMPTY_FORM) }
    else showToast(d.error || "Failed")
    setSaving(false)
  }

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    // Routed through the dedicated approve/reject endpoints (not a generic
    // PATCH) so this always writes the same seller notification + admin_logs
    // entry as approving/rejecting from the Overview queue does.
    const endpoint = status === "approved" ? "approve" : "reject"
    await fetch(`/api/admin/products/${id}/${endpoint}`, { method: "POST" })
    setProducts(p => p.map(x => x.id === id ? { ...x, approval_status: status } : x))
    showToast(`Product ${status}`)
  }

  const toggleFeatured = async (id: string, current: boolean) => {
    await fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_featured: !current }) })
    setProducts(p => p.map(x => x.id === id ? { ...x, is_featured: !current } : x))
    showToast(!current ? "Featured" : "Unfeatured")
  }

  const toggleVerifiedMark = async (product: Product, mark: "gi-certified" | "handloom-certified") => {
    const tags = product.tags || []
    const nextTags = tags.includes(mark) ? tags.filter(tag => tag !== mark) : [...tags, mark]
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tags: nextTags }),
    })
    if (!response.ok) { showToast("Could not update origin mark"); return }
    setProducts(items => items.map(item => item.id === product.id ? { ...item, tags: nextTags } : item))
    showToast(mark === "gi-certified" ? "GI origin mark updated" : "Handloom mark updated")
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return
    setDeleting(id)
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    setProducts(p => p.filter(x => x.id !== id))
    setDeleting(null)
    showToast("Deleted")
  }

  const filtered = products.filter(p => {
    const mf = filter === "all" || p.approval_status === filter || (filter === "featured" && p.is_featured)
    const q = search.toLowerCase()
    return mf && (!q || p.name.toLowerCase().includes(q))
  })

  const counts = {
    all: products.length,
    approved: products.filter(p => p.approval_status === "approved").length,
    pending: products.filter(p => p.approval_status === "pending").length,
    rejected: products.filter(p => p.approval_status === "rejected").length,
    featured: products.filter(p => p.is_featured).length,
  }

  return (
    <div className="p-7">
      {toast && (
        <div className="fixed top-6 right-6 z-50 ag-toast">
          <div className="flex items-center gap-3 bg-[#111827] text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl" style={{ borderLeft: "3px solid #FACC15" }}>
            <Check size={14} className="text-[#FACC15]" /> {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 ag-slide-up">
        <div>
          <h1 className="text-[22px] font-black text-[#111827] tracking-tight">Products</h1>
          <p className="text-[12px] text-[#111827]/40 mt-1">{products.length} total products across all sellers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#111827]/40 hover:text-[#111827] ag-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl ag-btn-primary text-[12px] font-black ag-btn">
            <Plus size={13} /> Add Product
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="ag-card rounded-2xl p-5 mb-5 ag-slide-up" style={{ border: "1px solid rgba(250,204,21,0.3)" }}>
          <h2 className="text-[12px] font-black text-[#111827] mb-4">New Product</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Product Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="e.g. Handwoven Silk Saree" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Mode *</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                <option value="handmade">Handcrafted / Artisan-made</option>
                <option value="machine_made">Precision Loom / Contemporary Crafted</option>
              </select>
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Seller *</label>
              <select value={form.seller_id} onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                <option value="">Select seller...</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Category</label>
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">State Code</label>
              <select value={form.state_code} onChange={e => setForm(f => ({ ...f, state_code: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                <option value="">Select state...</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Price (Rs) *</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="0" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">MRP (Rs)</label>
              <input type="number" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="0" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full px-3 py-2 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
              style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-[9.5px] font-black uppercase tracking-wide text-[#111827]/40">Product Images</label>
            <FileUploadZone value={form.images} onChange={images => setForm(current => ({ ...current, images }))}
              purpose="product-image" maxFiles={5} aspectRatio="1:1" label="Add product images" />
          </div>
          <div className="flex gap-2">
            <button onClick={createProduct} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 ag-btn-primary text-[12px] font-black rounded-xl ag-btn disabled:opacity-60">
              <Check size={13} /> {saving ? "Creating..." : "Create Product"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="px-5 py-2 text-[12px] font-semibold text-[#111827]/45 hover:bg-black/5 rounded-xl ag-btn transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4 ag-slide-up" style={{ animationDelay: "60ms" }}>
        {(["all","approved","pending","rejected","featured"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[9.5px] font-black uppercase tracking-wide ag-btn transition-all"
            style={filter === f
              ? { background: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(17,24,39,0.08)" }
              : { background: "transparent", color: "#4B5563", border: "1px solid transparent" }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 ag-slide-up" style={{ animationDelay: "80ms" }}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111827]/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#111827] placeholder:text-[#111827]/30 focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
          style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
      </div>

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "100ms" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Product","Price","Mode","State","Featured","Status","Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td colSpan={7} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-[12px] text-[#111827]/30">No products found</td></tr>
            ) : filtered.map((p, i) => (
              <tr key={p.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 25}ms` }}>
                <td className="px-5 py-3">
                  <span className="font-bold text-[#111827] text-[12px] truncate block max-w-[200px]">{p.name}</span>
                </td>
                <td className="px-5 py-3 font-black text-[13px] text-[#111827]">{formatCurrency(p.price)}</td>
                <td className="px-5 py-3">
                  <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                    style={p.mode === "handmade"
                      ? { background: "rgba(5,150,105,0.09)", color: "#065f46" }
                      : { background: "rgba(37,99,235,0.09)", color: "#1d4ed8" }}>
                    {p.mode === "handmade" ? "Handcrafted" : "Contemporary"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="text-[11px] text-[#111827]/40">{p.state_code || "—"}</div>
                  <div className="mt-1 flex gap-1">
                    {([["gi-certified", "GI"], ["handloom-certified", "Loom"]] as const).map(([mark, label]) => {
                      const selected = (p.tags || []).includes(mark)
                      return <button key={mark} type="button" onClick={() => toggleVerifiedMark(p, mark)}
                        title={`${selected ? "Remove" : "Verify"} ${mark === "gi-certified" ? "GI origin" : "handloom"} mark after reviewing evidence`}
                        aria-label={`${selected ? "Remove" : "Verify"} ${mark === "gi-certified" ? "GI origin" : "handloom"} mark for ${p.name}`}
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${selected ? "bg-emerald-50 text-emerald-800" : "bg-[#f3f3f3] text-[#4d4632] hover:bg-[#eeeeee]"}`}>
                        {selected ? `${label} verified` : `${label} +`}
                      </button>
                    })}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => toggleFeatured(p.id, p.is_featured)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-all"
                    style={p.is_featured
                      ? { background: "#FACC15", color: "#111827" }
                      : { background: "rgba(0,0,0,0.04)", color: "rgba(17,24,39,0.3)" }}>
                    <Star size={11} fill={p.is_featured ? "currentColor" : "none"} />
                  </button>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                    style={STATUS_PILL[p.approval_status] || { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                    {p.approval_status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    {p.approval_status !== "approved" && (
                      <button onClick={() => setStatus(p.id, "approved")}
                        className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn"
                        style={{ background: "rgba(22,163,74,0.09)", color: "#15803d" }}>
                        <Check size={11} />
                      </button>
                    )}
                    {p.approval_status !== "rejected" && (
                      <button onClick={() => setStatus(p.id, "rejected")}
                        className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn"
                        style={{ background: "rgba(220,38,38,0.09)", color: "#b91c1c" }}>
                        <X size={11} />
                      </button>
                    )}
                    <button onClick={() => deleteProduct(p.id)} disabled={deleting === p.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn disabled:opacity-40"
                      style={{ background: "rgba(220,38,38,0.06)", color: "#ef4444" }}
                      onMouseEnter={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.14)" }}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.06)"}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 text-[10.5px] text-[#111827]/25 font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          Showing {filtered.length} of {products.length}
        </div>
      </div>
    </div>
  )
}
