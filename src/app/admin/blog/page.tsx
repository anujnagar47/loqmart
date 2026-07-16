"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw, Check } from "lucide-react"

interface BlogPost {
  id: string; title: string; slug: string; excerpt: string | null
  content: string | null; is_published: boolean; created_at: string
  image_url: string | null; category: string | null; author: string | null
  read_time: string | null; state: string | null; view_count: number
}

const EMPTY_FORM = { title: "", slug: "", excerpt: "", content: "", image_url: "", category: "general", author: "LoqMart Editorial", read_time: "5 min", state: "", state_code: "" }
const CATEGORIES = ["general", "artisan", "state-story", "product-guide", "news"]

const CAT_PILL: Record<string, { background: string; color: string }> = {
  artisan:         { background: "rgba(124,58,237,0.09)", color: "#6d28d9" },
  "state-story":   { background: "rgba(5,150,105,0.09)",  color: "#065f46" },
  "product-guide": { background: "rgba(37,99,235,0.09)",  color: "#1d4ed8" },
  news:            { background: "rgba(217,119,6,0.09)",  color: "#b45309" },
  general:         { background: "rgba(100,116,139,0.09)", color: "#475569" },
}

export default function BlogPage() {
  const [posts, setPosts]       = useState<BlogPost[]>([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editId, setEditId]     = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/blog")
      if (r.ok) { const d = await r.json(); setPosts(d.posts || []) }
      else setPosts([])
    } catch { setPosts([]) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500) }
  const autoSlug  = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const openEdit  = (p: BlogPost) => {
    setEditId(p.id)
    setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt || "", content: p.content || "", image_url: p.image_url || "", category: p.category || "general", author: p.author || "LoqMart Editorial", read_time: p.read_time || "5 min", state: p.state || "", state_code: "" })
    setShowForm(true)
  }
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

  const save = async () => {
    if (!form.title.trim()) { showToast("Title required"); return }
    setSaving(true)
    const payload = { ...form, slug: form.slug || autoSlug(form.title) }
    if (editId) {
      const r = await fetch(`/api/admin/blog/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (r.ok) { setPosts(p => p.map(x => x.id === editId ? { ...x, ...payload } : x)); showToast("Updated") }
      else { const d = await r.json(); showToast(d.error || "Failed") }
    } else {
      const r = await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (r.ok) { const d = await r.json(); if (d.post) setPosts(p => [d.post, ...p]); showToast("Post created") }
      else { const d = await r.json(); showToast(d.error || "Failed") }
    }
    setSaving(false)
    cancelForm()
  }

  const togglePublish = async (id: string, current: boolean) => {
    const r = await fetch(`/api/admin/blog/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_published: !current }) })
    if (r.ok) { setPosts(p => p.map(x => x.id === id ? { ...x, is_published: !current } : x)); showToast(current ? "Unpublished" : "Published") }
  }

  const deletePost = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    const r = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" })
    if (r.ok) { setPosts(p => p.filter(x => x.id !== id)); showToast("Deleted") }
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
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight">Blog</h1>
          <p className="text-[12px] text-[#1a1c1c]/40 mt-1">{posts.length} articles · artisan stories, state highlights, product guides</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl ag-card flex items-center justify-center text-[#1a1c1c]/40 hover:text-[#1a1c1c] ag-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm(EMPTY_FORM) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl ag-btn-primary text-[12px] font-black ag-btn">
            <Plus size={13} /> New Post
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="ag-card rounded-2xl p-5 mb-5 ag-slide-up" style={{ border: "1px solid rgba(252,208,32,0.3)" }}>
          <h2 className="text-[12px] font-black text-[#1a1c1c] mb-4">{editId ? "Edit Post" : "New Post"}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: editId ? f.slug : autoSlug(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="Article title..." />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Slug</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="auto-generated" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Author</label>
              <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Read Time</label>
              <input value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="5 min" />
            </div>
            <div>
              <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Cover Image URL</label>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="https://..." />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Excerpt</label>
            <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2}
              className="w-full px-3 py-2 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
              style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="Short description..." />
          </div>
          <div className="mb-5">
            <label className="text-[9.5px] font-black uppercase tracking-wide text-[#1a1c1c]/40 block mb-1.5">Content (Markdown)</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8}
              className="w-full px-3 py-2 rounded-xl text-[13px] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#fcd020]/50"
              style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)" }} placeholder="# Heading..." />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 ag-btn-primary text-[12px] font-black rounded-xl ag-btn disabled:opacity-60">
              <Check size={13} /> {saving ? "Saving..." : editId ? "Save" : "Create"}
            </button>
            <button onClick={cancelForm} className="px-5 py-2 text-[12px] font-semibold text-[#1a1c1c]/45 hover:bg-black/5 rounded-xl ag-btn transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="ag-card rounded-2xl overflow-hidden ag-slide-up" style={{ animationDelay: "80ms" }}>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 ag-shimmer rounded-xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-[12px] text-[#1a1c1c]/25">No blog posts yet. Create your first article above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Title","Category","Author","Views","Status","Date","Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#1a1c1c]/28">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((p, i) => (
                <tr key={p.id} className="ag-table-row ag-row-in" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", animationDelay: `${i * 30}ms` }}>
                  <td className="px-5 py-3">
                    <p className="font-bold text-[#1a1c1c] text-[12px] truncate max-w-[180px]">{p.title}</p>
                    <p className="font-mono text-[9.5px] text-[#1a1c1c]/28 truncate">{p.slug}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                      style={CAT_PILL[p.category || "general"] || { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                      {p.category || "general"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/45">{p.author || "-"}</td>
                  <td className="px-5 py-3 text-[12px] font-bold text-[#1a1c1c]/50">{p.view_count || 0}</td>
                  <td className="px-5 py-3">
                    <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                      style={p.is_published
                        ? { background: "rgba(22,163,74,0.09)", color: "#15803d" }
                        : { background: "rgba(100,116,139,0.09)", color: "#475569" }}>
                      {p.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-[#1a1c1c]/30">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => togglePublish(p.id, p.is_published)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                        style={p.is_published
                          ? { background: "rgba(22,163,74,0.09)", color: "#15803d" }
                          : { background: "rgba(100,116,139,0.09)", color: "#64748b" }}>
                        {p.is_published ? <Eye size={11} /> : <EyeOff size={11} />}
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                        style={{ background: "rgba(252,208,32,0.12)", color: "#725c00" }}>
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => deletePost(p.id, p.title)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
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
        )}
        {posts.length > 0 && (
          <div className="px-5 py-3 text-[10.5px] text-[#1a1c1c]/25 font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
            {posts.length} posts
          </div>
        )}
      </div>
    </div>
  )
}
