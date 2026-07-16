"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Check, RefreshCw } from "lucide-react"

interface Category {
  id: string; name: string; slug: string; description: string | null
  image_url: string | null; sort_order: number; created_at: string
}

const EMPTY_FORM = { name: "", slug: "", description: "", image_url: "", sort_order: 99 }

export default function CategoriesPage() {
  const [cats, setCats]         = useState<Category[]>([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editId, setEditId]     = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast]       = useState("")
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/categories").then(r => r.json()).then(d => {
      setCats(d.categories || [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500) }
  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const handleNameChange = (name: string) => { setForm(f => ({ ...f, name, slug: editId ? f.slug : autoSlug(name) })) }
  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true) }
  const openEdit = (cat: Category) => { setEditId(cat.id); setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", image_url: cat.image_url || "", sort_order: cat.sort_order }); setShowForm(true) }
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) { showToast("Name and slug are required"); return }
    setSaving(true)
    if (editId) {
      await fetch(`/api/admin/categories/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      setCats(p => p.map(c => c.id === editId ? { ...c, ...form } : c))
      showToast("Category updated")
    } else {
      const r = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const d = await r.json()
      if (d.category) setCats(p => [...p, d.category])
      showToast("Category created")
    }
    setSaving(false)
    cancelForm()
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Products in this category may be affected.`)) return
    setDeleting(id)
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
    setCats(p => p.filter(c => c.id !== id))
    setDeleting(null)
    showToast("Category deleted")
  }

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
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Categories</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">{cats.length} categories · displayed on storefront</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl ag-btn-primary text-[12px] font-black ag-btn">
            <Plus size={13} /> New Category
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="ag-card rounded-2xl p-5 mb-5 ag-slide-up" style={{ border: "1px solid rgba(252,208,32,0.3)" }}>
          <h2 className="text-[12px] font-black text-[#1a1c1c] mb-4">{editId ? "Edit Category" : "New Category"}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Name *</label>
              <input value={form.name} onChange={e => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="e.g. Handloom Textiles" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Slug *</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="handloom-textiles" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Image URL</label>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="https://..." />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Sort Order</label>
              <input type="number" min={1} max={99} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
            </div>
          </div>
          <div className="mb-5">
            <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full px-3 py-2 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
              style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="Short description of this category..." />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 ag-btn-primary text-[12px] font-black rounded-xl ag-btn disabled:opacity-60">
              <Check size={13} /> {saving ? "Saving..." : editId ? "Save Changes" : "Create Category"}
            </button>
            <button onClick={cancelForm} className="px-5 py-2 text-[12px] font-semibold text-[#1a1c1c]/45 hover:bg-black/5 rounded-xl ag-btn transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "80ms" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["#","Image","Name","Slug","Description","Order","Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(4)].map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td colSpan={7} className="px-5 py-3"><div className="h-3.5 ag-shimmer rounded" /></td>
              </tr>
            )) : cats.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-[12px] text-[#1a1c1c]/30">No categories yet — create one above</td></tr>
            ) : cats.map((cat, i) => (
              <tr key={cat.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 35}ms` }}>
                <td className="px-5 py-3 text-[#1a1c1c]/25 font-black text-[11px]">{i + 1}</td>
                <td className="px-5 py-3">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black text-[#1a1c1c]/20"
                      style={{ background: "rgba(252,208,32,0.1)" }}>
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 font-bold text-[#1a1c1c] text-[13px]">{cat.name}</td>
                <td className="px-5 py-3 font-mono text-[10.5px] text-[#1a1c1c]/40">{cat.slug}</td>
                <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/40 max-w-[200px] truncate">{cat.description || "—"}</td>
                <td className="px-5 py-3 text-center font-bold text-[#1a1c1c]/40 text-[12px]">{cat.sort_order}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cat)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                      style={{ background: "rgba(252,208,32,0.12)", color: "#725c00" }}>
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => deleteCategory(cat.id, cat.name)} disabled={deleting === cat.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors disabled:opacity-40"
                      style={{ background: "rgba(220,38,38,0.06)", color: "#ef4444" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.14)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.06)"}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
