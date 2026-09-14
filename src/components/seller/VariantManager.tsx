"use client"

import { useEffect, useState } from "react"
import { X, Plus, Trash2, Edit2, Check, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { ProductVariant } from "@/types/database"

const EMPTY_FORM = { name: "", sku: "", price: "", mrp: "", stock: "0", is_default: false }

interface VariantManagerProps {
  productId: string
  productName: string
  onClose: () => void
}

export function VariantManager({ productId, productName, onClose }: VariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm,  setEditForm]  = useState(EMPTY_FORM)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/seller/products/${productId}/variants`)
      .then(r => r.ok ? r.json() : { variants: [] })
      .then(d => { if (!cancelled) setVariants(d.variants || []) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [productId])

  async function addVariant() {
    if (!form.name.trim()) { setError("Variant name is required"); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/seller/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku.trim() || null,
          price: form.price ? Number(form.price) : null,
          mrp: form.mrp ? Number(form.mrp) : null,
          stock: Number(form.stock) || 0,
          is_default: form.is_default,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to add variant"); return }
      setVariants(v => [...v, data.variant])
      setForm(EMPTY_FORM)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(v: ProductVariant) {
    setEditingId(v.id)
    setEditForm({
      name: v.name, sku: v.sku || "",
      price: v.price != null ? String(v.price) : "",
      mrp: v.mrp != null ? String(v.mrp) : "",
      stock: String(v.stock), is_default: v.is_default,
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/seller/products/${productId}/variants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          sku: editForm.sku.trim() || null,
          price: editForm.price ? Number(editForm.price) : null,
          mrp: editForm.mrp ? Number(editForm.mrp) : null,
          stock: Number(editForm.stock) || 0,
          is_default: editForm.is_default,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to update variant"); return }
      setVariants(vs => vs.map(v => v.id === id ? data.variant : v))
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  async function deleteVariant(id: string) {
    const res = await fetch(`/api/seller/products/${productId}/variants/${id}`, { method: "DELETE" })
    if (res.ok) setVariants(vs => vs.filter(v => v.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(26,28,28,0.5)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-black text-[#1a1c1c]">Manage Variants</h2>
            <p className="text-[11px] text-[#1a1c1c]/45 mt-0.5 truncate max-w-[300px]">{productName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#1a1c1c]/5">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#1a1c1c]/30" /></div>
        ) : (
          <>
            {variants.length === 0 ? (
              <p className="text-[12px] text-[#1a1c1c]/40 mb-4">
                No variants yet — this product sells as a single option using its base price and stock.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {variants.map(v => (
                  <div key={v.id} className="rounded-xl p-3" style={{ border: "1px solid rgba(26,28,28,0.08)" }}>
                    {editingId === v.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Name" className="px-2.5 py-1.5 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                          <input value={editForm.sku} onChange={e => setEditForm(f => ({ ...f, sku: e.target.value }))}
                            placeholder="SKU (optional)" className="px-2.5 py-1.5 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                          <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                            placeholder="Price override" className="px-2.5 py-1.5 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                          <input type="number" value={editForm.mrp} onChange={e => setEditForm(f => ({ ...f, mrp: e.target.value }))}
                            placeholder="MRP override" className="px-2.5 py-1.5 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                          <input type="number" min="0" value={editForm.stock} onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))}
                            placeholder="Stock" className="px-2.5 py-1.5 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                          <label className="flex items-center gap-1.5 text-[11px] text-[#1a1c1c]/60 font-semibold">
                            <input type="checkbox" checked={editForm.is_default} onChange={e => setEditForm(f => ({ ...f, is_default: e.target.checked }))} />
                            Default selection
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(v.id)} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black text-[#1a1c1c]" style={{ background: "#fcd020" }}>
                            <Check size={11} /> Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#1a1c1c]/50">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold text-[#1a1c1c] truncate">
                            {v.name} {v.is_default && <span className="text-[9px] font-black uppercase text-[#725c00] ml-1">Default</span>}
                          </p>
                          <p className="text-[11px] text-[#1a1c1c]/45 mt-0.5">
                            {v.price != null ? formatCurrency(v.price) : "Base price"} · Stock: {v.stock}
                            {v.sku && <> · SKU: {v.sku}</>}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEdit(v)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(252,208,32,0.12)", color: "#725c00" }}>
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => deleteVariant(v.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.06)", color: "#ef4444" }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3" style={{ borderTop: "1px solid rgba(26,28,28,0.06)" }}>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#1a1c1c]/40 mb-2">Add Variant</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Name (e.g. Large)" className="px-2.5 py-2 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="SKU (optional)" className="px-2.5 py-2 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="Price override (optional)" className="px-2.5 py-2 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                <input type="number" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                  placeholder="MRP override (optional)" className="px-2.5 py-2 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="Stock *" className="px-2.5 py-2 rounded-lg text-[12px]" style={{ border: "1px solid rgba(26,28,28,0.15)" }} />
                <label className="flex items-center gap-1.5 text-[11px] text-[#1a1c1c]/60 font-semibold">
                  <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
                  Default selection
                </label>
              </div>
              {error && <p className="text-[11px] text-red-600 font-semibold mb-2">{error}</p>}
              <button onClick={addVariant} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-black text-[#1a1c1c] disabled:opacity-50" style={{ background: "#fcd020" }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Variant
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
