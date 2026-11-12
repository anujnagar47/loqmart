"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Package, Plus, Edit2, Trash2,
  Check, X, RefreshCw, Search, ChevronDown, AlertCircle, LogOut,
  Star, ArrowRight, Bell, Layers,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { VariantManager } from "@/components/seller/VariantManager"
import { FileUploadZone } from "@/components/ui/file-upload-zone"

// ──────────────────────────────────────────────
// Helpers / micro-components
// ──────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed top-5 right-5 z-50">
      <div className="flex items-center gap-3 bg-[#111827] text-white text-[13px] font-semibold px-4 py-3 rounded-2xl shadow-2xl"
        style={{ borderLeft: "3px solid #FACC15" }}>
        <Check size={13} className="text-[#FACC15]" />
        {msg}
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[9.5px] font-black uppercase tracking-widest text-[#111827]/40 block mb-1.5">
      {children}
    </label>
  )
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50 ${className}`}
      style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)" }}
      {...props}
    />
  )
}

function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50 ${className}`}
      style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)" }}
      {...props}
    />
  )
}

const STATUS_PILL: Record<string, { background: string; color: string }> = {
  paid:              { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  pending:           { background: "rgba(217,119,6,0.09)",   color: "#b45309" },
  failed:            { background: "rgba(220,38,38,0.09)",   color: "#b91c1c" },
  delivered:         { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  confirmed:         { background: "rgba(37,99,235,0.09)",   color: "#1d4ed8" },
  processing:        { background: "rgba(37,99,235,0.09)",   color: "#1d4ed8" },
  shipped:           { background: "rgba(124,58,237,0.09)",  color: "#6d28d9" },
  out_for_delivery:  { background: "rgba(14,165,233,0.09)",  color: "#0284c7" },
  cancelled:         { background: "rgba(220,38,38,0.09)",   color: "#b91c1c" },
  approved:          { background: "rgba(22,163,74,0.09)",   color: "#15803d" },
  rejected:          { background: "rgba(220,38,38,0.09)",   color: "#b91c1c" },
}

function Pill({ status }: { status: string }) {
  const s = STATUS_PILL[status] || { background: "rgba(100,116,139,0.09)", color: "#475569" }
  return (
    <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap"
      style={s}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

const INDIAN_STATES = [
  "AN","AP","AR","AS","BR","CH","CT","DD","DL","DN","GA","GJ","HP","HR","JH","JK",
  "KA","KL","LA","LD","MH","ML","MN","MP","MZ","NL","OR","PB","PY","RJ","SK","TG","TN","TR","UP","UA","WB",
]

const EMPTY_PRODUCT = {
  name: "", description: "", price: "", mrp: "", stock: "1",
  unit: "piece", mode: "handmade", category_id: "", state_code: "", tags: "",
  images: [] as string[],
  specifications: { material: "", color: "", weight: "", dimensions: "", care_instructions: "" },
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────

export default function SellerDashboard() {
  const router  = useRouter()
  const [tab, setTab] = useState<"overview"|"orders"|"products"|"analytics"|"earnings"|"settings">("overview")
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")
  const [isPending, setIsPending] = useState(false)
  const [toast, setToast]     = useState("")
  const [search, setSearch]   = useState("")

  // Product form state
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editProduct, setEditProduct]       = useState<any>(null)
  const [productForm, setProductForm]       = useState(EMPTY_PRODUCT)
  const [variantProduct, setVariantProduct] = useState<{ id: string; name: string } | null>(null)
  const [savingProduct, setSavingProduct]   = useState(false)
  const [categories, setCategories]         = useState<any[]>([])

  // Orders state
  const [expandedOrder, setExpandedOrder]   = useState<string | null>(null)

  // Settings form state
  const [settingsForm, setSettingsForm]     = useState({ business_name: "", owner_name: "", city: "", state: "", phone: "", description: "", bank_account_number: "", bank_ifsc: "" })
  const [savingSettings, setSavingSettings] = useState(false)

  // Stock edit state
  const [editStock, setEditStock] = useState<{ id: string; value: string } | null>(null)

  const showToast = (m: string) => { setToast(m) }

  const load = useCallback(async () => {
    setLoading(true)
    setIsPending(false)
    setError("")
    try {
      const res = await fetch("/api/seller/dashboard")
      if (res.status === 401) { router.push("/seller/login"); return }
      if (res.status === 403) {
        const b = await res.json()
        if (b.status === "pending") {
          setIsPending(true)
          setError("pending")
        } else {
          setError("Your seller account is not approved.")
        }
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error("Dashboard unavailable")
      const json = await res.json()
      setData(json)
      const seller = json.seller
      setSettingsForm({
        business_name: seller.business_name || "",
        owner_name:    seller.owner_name    || "",
        city:          seller.city          || "",
        state:         seller.state         || "",
        phone:         seller.phone         || "",
        description:   seller.description   || "",
        bank_account_number: seller.bank_account_number || "",
        bank_ifsc:     seller.bank_ifsc     || "",
      })
    } catch (e: any) {
      setError(e.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []))
  }, [load])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/seller/login")
  }

  // ── Product CRUD ──
  const openAddProduct = () => {
    setEditProduct(null)
    setProductForm(EMPTY_PRODUCT)
    setShowAddProduct(true)
  }
  const openEditProduct = (p: any) => {
    setEditProduct(p)
    setProductForm({
      name: p.name, description: p.description || "", price: String(p.price),
      mrp: p.mrp ? String(p.mrp) : "", stock: String(p.stock),
      unit: p.unit || "piece", mode: p.mode || "handmade",
      category_id: p.category_id || "", state_code: p.state_code || "",
      tags: (p.tags || []).join(", "),
      images: Array.isArray(p.images) ? p.images : [],
      specifications: {
        material: p.specifications?.material || "",
        color: p.specifications?.color || "",
        weight: p.specifications?.weight || "",
        dimensions: p.specifications?.dimensions || "",
        care_instructions: p.specifications?.care_instructions || "",
      },
    })
    setShowAddProduct(true)
  }
  const cancelProductForm = () => { setShowAddProduct(false); setEditProduct(null); setProductForm(EMPTY_PRODUCT) }

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) { showToast("Name and price are required"); return }
    setSavingProduct(true)
    const specsClean = Object.fromEntries(
      Object.entries(productForm.specifications).filter(([, v]) => v.trim() !== "")
    )
    const payload = {
      ...productForm,
      price:  Number(productForm.price),
      mrp:    productForm.mrp ? Number(productForm.mrp) : null,
      stock:  Number(productForm.stock),
      tags:   productForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      category_id: productForm.category_id || null,
      images: productForm.images,
      specifications: Object.keys(specsClean).length > 0 ? specsClean : null,
    }

    let ok = false
    if (editProduct) {
      const r = await fetch(`/api/seller/products/${editProduct.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      if (r.ok) {
        const d = await r.json()
        setData((prev: any) => ({
          ...prev,
          products: prev.products.map((x: any) => x.id === editProduct.id ? { ...x, ...d.product } : x),
        }))
        showToast("Product updated")
        ok = true
      } else { const d = await r.json(); showToast(d.error || "Failed to update") }
    } else {
      const r = await fetch("/api/seller/products", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      if (r.ok) {
        showToast("Product submitted for approval")
        ok = true
        load()
      } else { const d = await r.json(); showToast(d.error || "Failed to create") }
    }

    setSavingProduct(false)
    if (ok) cancelProductForm()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("Remove this product? This cannot be undone.")) return
    const r = await fetch(`/api/seller/products/${id}`, { method: "DELETE" })
    if (r.ok) {
      setData((prev: any) => ({ ...prev, products: prev.products.filter((p: any) => p.id !== id) }))
      showToast("Product removed")
    } else { const d = await r.json(); showToast(d.error || "Cannot delete — may have active orders") }
  }

  const saveStock = async (id: string) => {
    if (!editStock) return
    const newStock = Number(editStock.value)
    if (isNaN(newStock) || newStock < 0) { showToast("Invalid stock value"); return }
    const r = await fetch(`/api/seller/products/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock: newStock }),
    })
    if (r.ok) {
      setData((prev: any) => ({ ...prev, products: prev.products.map((p: any) => p.id === id ? { ...p, stock: newStock } : p) }))
      showToast("Stock updated")
    }
    setEditStock(null)
  }

  // ── Settings save ──
  const saveSettings = async () => {
    setSavingSettings(true)
    // Seller profile update via PATCH to seller register route approach:
    // We'll use a dedicated endpoint or update the seller record directly
    // For now, POST to a dedicated settings endpoint on the seller API
    const r = await fetch("/api/seller/dashboard", { method: "PATCH",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsForm),
    })
    if (r.ok) { showToast("Profile updated"); load() }
    else { const d = await r.json(); showToast(d.error || "Failed to save") }
    setSavingSettings(false)
  }

  // ─── Loading / error states ──────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FBF9F5" }}>
        <div className="space-y-3 w-60">
          {[...Array(4)].map((_, i) => <div key={i} className="h-8 rounded-xl ag-shimmer" />)}
        </div>
      </div>
    )
  }

  if (error) {
    if (isPending) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FBF9F5" }}>
          <div className="max-w-md w-full ag-card rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(250,204,21,0.15)", border: "2px solid rgba(250,204,21,0.4)" }}>
              <Check size={28} className="text-[#111827]" />
            </div>
            <h2 className="text-[20px] font-black text-[#111827] mb-2">Application Submitted!</h2>
            <p className="text-[13px] text-[#111827]/55 mb-7 leading-relaxed">
              Your seller application is under review. We&apos;ll notify you within 2–3 business days once approved.
            </p>
            <div className="text-left space-y-3 mb-7 p-4 rounded-xl" style={{ background: "#FBF9F5" }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#111827]/35 mb-2">What happens next</p>
              {[
                "Our team reviews your business details and documents",
                "You receive an email notification upon approval",
                "Log back into your dashboard to start listing products",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "#FACC15" }}>
                    <span className="text-[9px] font-black text-[#111827]">{i + 1}</span>
                  </div>
                  <p className="text-[12px] text-[#111827]/60 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => router.push("/")}
                className="px-5 py-2.5 rounded-xl text-[12px] font-black ag-btn"
                style={{ background: "rgba(0,0,0,0.07)", color: "#111827" }}>
                Back to Home
              </button>
              <button onClick={load}
                className="px-5 py-2.5 rounded-xl text-[12px] font-black ag-btn ag-btn-primary">
                Check Status
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FBF9F5" }}>
        <div className="max-w-sm w-full ag-card rounded-2xl p-8 text-center">
          <AlertCircle size={28} className="text-orange-500 mx-auto mb-4" />
          <h2 className="text-[17px] font-black text-[#111827] mb-2">Access Restricted</h2>
          <p className="text-[12px] text-[#111827]/55 mb-6 leading-relaxed">{error}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => router.push("/")}
              className="px-4 py-2 rounded-xl text-[12px] font-black ag-btn"
              style={{ background: "rgba(0,0,0,0.07)", color: "#111827" }}>
              Home
            </button>
            <button onClick={() => router.push("/seller/register")}
              className="px-4 py-2 rounded-xl text-[12px] font-black ag-btn ag-btn-primary">
              Register as Seller
            </button>
          </div>
        </div>
      </div>
    )
  }

  const seller   = data?.seller   || {}
  const stats    = data?.stats    || {}
  const earnings = data?.earnings || {}
  const products = data?.products || []
  const orders   = data?.recentOrders || []

  const lowStock  = products.filter((p: any) => p.approval_status === "approved" && p.stock <= 5 && p.stock > 0)
  const noStock   = products.filter((p: any) => p.stock === 0)
  const hasAlerts = lowStock.length > 0 || noStock.length > 0

  const filteredProducts = products.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredOrders = orders.filter((o: any) =>
    !search || o.order_number?.toLowerCase().includes(search.toLowerCase())
  )

  const initials = (seller.business_name || "S").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()

  const TABS = [
    { id: "overview",   label: "Overview"  },
    { id: "orders",     label: "Orders"    },
    { id: "products",   label: "Products"  },
    { id: "analytics",  label: "Analytics" },
    { id: "earnings",   label: "Earnings"  },
    { id: "settings",   label: "Settings"  },
  ] as const

  return (
    <div className="min-h-screen" style={{
      background: "#FBF9F5",
      backgroundImage: `radial-gradient(ellipse at 80% 10%, rgba(250,204,21,0.07) 0%, transparent 45%)`,
    }}>
      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      {variantProduct && (
        <VariantManager
          productId={variantProduct.id}
          productName={variantProduct.name}
          onClose={() => setVariantProduct(null)}
        />
      )}

      {/* ── Top header ── */}
      <div style={{ background: "linear-gradient(180deg, #111827 0%, #232525 100%)", borderBottom: "1px solid rgba(250,204,21,0.12)" }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black shrink-0"
              style={{ background: "#FACC15", color: "#111827" }}>
              {initials}
            </div>
            <div>
              <h1 className="text-[16px] font-black text-white tracking-tight leading-none">{seller.business_name || "My Store"}</h1>
              <p className="text-[10.5px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {seller.owner_name} · {seller.state || "India"} · Seller since {seller.created_at ? new Date(seller.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setTab("products"); openAddProduct() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 ag-btn"
              style={{ background: "#FACC15", color: "#111827" }}>
              <Plus size={11} /> Add Product
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.2)" }}>
              <Star size={11} fill="#FACC15" className="text-[#FACC15]" />
              <span className="text-[11px] font-black text-[#FACC15]">Rank {stats.swadeshiRank || "—"}</span>
            </div>
            {hasAlerts && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" }}>
                <Bell size={11} className="text-red-400" />
                <span className="text-[11px] font-black text-red-400">{lowStock.length + noStock.length} alerts</span>
              </div>
            )}
            <button onClick={load} className="w-8 h-8 rounded-xl flex items-center justify-center ag-btn"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={handleLogout} className="w-8 h-8 rounded-xl flex items-center justify-center ag-btn"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-7xl mx-auto px-6 flex gap-0.5 overflow-x-auto pb-0">
          {TABS.map(({ id, label }) => {
            const active = tab === id
            return (
              <button key={id} onClick={() => setTab(id)}
                className="px-4 py-2.5 text-[12px] font-black whitespace-nowrap relative transition-colors"
                style={{ color: active ? "#FACC15" : "rgba(255,255,255,0.38)" }}>
                {label}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full" style={{ background: "#FACC15" }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-7">

        {/* ── STAT CARDS (always visible) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Revenue",     value: formatCurrency(stats.totalRevenue || 0),   sub: stats.monthlyRevenue > 0 ? `+${formatCurrency(stats.monthlyRevenue)} this month` : "All time", color: "#15803d" },
            { label: "Total Orders",      value: (stats.totalOrders || 0).toLocaleString("en-IN"), sub: stats.monthlyOrders > 0 ? `${stats.monthlyOrders} this month` : "All time",               color: "#1d4ed8" },
            { label: "Active Products",   value: (stats.activeProducts || 0).toString(),    sub: stats.pendingProducts > 0 ? `${stats.pendingProducts} awaiting approval` : "All live",           color: "#111827" },
            { label: "Avg Order Value",   value: formatCurrency(stats.averageOrderValue || 0), sub: "per order",                                                                                   color: "#6d28d9" },
          ].map((s, i) => (
            <div key={s.label} className="ag-card rounded-2xl p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-[22px] font-black text-[#111827] leading-none tracking-tight">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2 mb-1" style={{ color: "rgba(17,24,39,0.32)" }}>{s.label}</p>
              <p className="text-[10px] font-semibold" style={{ color: s.color }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ─────────────────────────────── */}
        {/* OVERVIEW TAB                   */}
        {/* ─────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-5">
            {/* Start selling CTA — shown when seller has no products yet */}
            {products.length === 0 && (
              <div className="ag-card rounded-2xl p-8 text-center" style={{ border: "2px dashed rgba(250,204,21,0.45)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(250,204,21,0.12)" }}>
                  <Package size={24} className="text-[#111827]" />
                </div>
                <h3 className="text-[16px] font-black text-[#111827] mb-2">Start Selling on LoqMart</h3>
                <p className="text-[12px] text-[#111827]/45 mb-6 max-w-xs mx-auto leading-relaxed">
                  List your first product and start reaching millions of customers across India. Add photos, set your price, and go live.
                </p>
                <button onClick={() => { setTab("products"); openAddProduct() }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black ag-btn ag-btn-primary">
                  <Plus size={13} /> Add Your First Product
                </button>
              </div>
            )}

            {/* Alerts */}
            {hasAlerts && (
              <div className="ag-card rounded-2xl overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <AlertCircle size={13} className="text-red-500" />
                  <h2 className="text-[12px] font-black text-[#111827]">Stock Alerts</h2>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                  {noStock.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-[13px] font-bold text-[#111827]">{p.name}</p>
                        <p className="text-[10px] text-red-600 font-bold mt-0.5">Out of stock</p>
                      </div>
                      <button onClick={() => { setTab("products"); setSearch(p.name) }}
                        className="text-[10px] font-black px-3 py-1.5 rounded-lg ag-btn"
                        style={{ background: "rgba(220,38,38,0.08)", color: "#b91c1c" }}>
                        Update Stock
                      </button>
                    </div>
                  ))}
                  {lowStock.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-[13px] font-bold text-[#111827]">{p.name}</p>
                        <p className="text-[10px] text-orange-600 font-bold mt-0.5">Only {p.stock} left</p>
                      </div>
                      <button onClick={() => { setTab("products"); setSearch(p.name) }}
                        className="text-[10px] font-black px-3 py-1.5 rounded-lg ag-btn"
                        style={{ background: "rgba(217,119,6,0.08)", color: "#b45309" }}>
                        Update Stock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent orders */}
              <div className="ag-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <h2 className="text-[13px] font-black text-[#111827]">Recent Orders</h2>
                  <button onClick={() => setTab("orders")} className="flex items-center gap-1 text-[10px] font-bold text-[#111827]/35 hover:text-[#111827] ag-btn transition-colors">
                    View all <ArrowRight size={10} />
                  </button>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                  {orders.length === 0 ? (
                    <p className="px-5 py-10 text-center text-[12px] text-[#111827]/30">No orders yet</p>
                  ) : orders.slice(0, 5).map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-[13px] font-bold text-[#111827]">{o.order_number}</p>
                        <p className="text-[10px] text-[#111827]/40 mt-0.5">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-black text-[#111827]">{formatCurrency(o.total)}</p>
                        <Pill status={o.order_status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top products */}
              <div className="ag-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <h2 className="text-[13px] font-black text-[#111827]">Top Products by Sales</h2>
                  <button onClick={() => setTab("products")} className="flex items-center gap-1 text-[10px] font-bold text-[#111827]/35 hover:text-[#111827] ag-btn transition-colors">
                    Manage <ArrowRight size={10} />
                  </button>
                </div>
                <div className="px-5 py-4 space-y-4">
                  {products.length === 0 ? (
                    <p className="text-center text-[12px] text-[#111827]/30 py-6">No products yet</p>
                  ) : [...products].sort((a: any, b: any) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 5).map((p: any, i: number) => {
                    const max = products.reduce((m: number, x: any) => Math.max(m, x.sold_count || 0), 1)
                    const pct = max > 0 ? Math.round(((p.sold_count || 0) / max) * 100) : 0
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-[#111827]/60 truncate max-w-[200px]">{p.name}</span>
                          <span className="text-[11px] font-black text-[#111827] ml-2 shrink-0">{p.sold_count || 0} sold</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#FACC15" }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────── */}
        {/* ORDERS TAB                     */}
        {/* ─────────────────────────────── */}
        {tab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111827]/30 pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order number..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#111827] placeholder:text-[#111827]/30 focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                  style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
              </div>
              <div className="text-[11px] text-[#111827]/40 shrink-0 font-medium">{orders.length} orders</div>
            </div>

            <div className="ag-card rounded-2xl overflow-hidden">
              {orders.length === 0 ? (
                <p className="text-center py-16 text-[12px] text-[#111827]/30">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        {["Order","Amount","Status","Payment","Date",""].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o: any, i: number) => (
                        <React.Fragment key={o.id}>
                          <tr className="ag-table-row cursor-pointer" style={{ borderBottom: expandedOrder === o.id ? "none" : "1px solid rgba(0,0,0,0.03)" }}
                            onClick={() => setExpandedOrder(e => e === o.id ? null : o.id)}>
                            <td className="px-5 py-3 font-bold text-[#111827] text-[12px]">{o.order_number}</td>
                            <td className="px-5 py-3 font-black text-[13px] text-[#111827]">{formatCurrency(o.total)}</td>
                            <td className="px-5 py-3"><Pill status={o.order_status} /></td>
                            <td className="px-5 py-3"><Pill status={o.payment_status} /></td>
                            <td className="px-5 py-3 text-[11px] text-[#111827]/35">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                            <td className="px-5 py-3">
                              <ChevronDown size={13} className="text-[#111827]/25 transition-transform"
                                style={{ transform: expandedOrder === o.id ? "rotate(180deg)" : "" }} />
                            </td>
                          </tr>
                          {expandedOrder === o.id && (
                            <tr key={`${o.id}-detail`}>
                              <td colSpan={6} className="px-5 pb-4 pt-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: "rgba(255,255,255,0.5)" }}>
                                <div className="pt-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#111827]/30 mb-2">Order Items</p>
                                  {o.order_items && o.order_items.length > 0 ? (
                                    <div className="space-y-2">
                                      {o.order_items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.035)" }}>
                                          {item.products?.images?.[0] && (
                                            <img src={item.products.images[0]} alt={item.products?.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-bold text-[#111827] truncate">{item.products?.name || "Product"}</p>
                                            <p className="text-[10px] text-[#111827]/40 mt-0.5">{item.quantity} × {formatCurrency(item.price)}</p>
                                          </div>
                                          <p className="text-[12px] font-black text-[#111827]">{formatCurrency(item.total)}</p>
                                        </div>
                                      ))}
                                      <div className="flex justify-between px-3 pt-2">
                                        <span className="text-[11px] text-[#111827]/40">Shipping: {formatCurrency(o.shipping_cost || 0)}</span>
                                        <span className="text-[12px] font-black text-[#111827]">Total: {formatCurrency(o.total)}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-[#111827]/30">No item details available</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────── */}
        {/* PRODUCTS TAB                   */}
        {/* ─────────────────────────────── */}
        {tab === "products" && (
          <div className="space-y-4">
            {/* Product form */}
            {showAddProduct && (
              <div className="ag-card rounded-2xl p-5" style={{ border: "1px solid rgba(250,204,21,0.28)" }}>
                <h2 className="text-[13px] font-black text-[#111827] mb-4">
                  {editProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <FieldLabel>Product Name *</FieldLabel>
                    <Input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Handwoven Silk Saree" />
                  </div>
                  <div>
                    <FieldLabel>Mode *</FieldLabel>
                    <Select value={productForm.mode} onChange={e => setProductForm(f => ({ ...f, mode: e.target.value }))}>
                      <option value="handmade">Handcrafted / Artisan-made</option>
                      <option value="machine_made">Precision Loom / Contemporary Crafted</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Category</FieldLabel>
                    <Select value={productForm.category_id} onChange={e => setProductForm(f => ({ ...f, category_id: e.target.value }))}>
                      <option value="">Select category...</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Price (INR) *</FieldLabel>
                    <Input type="number" min="1" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <FieldLabel>MRP (INR)</FieldLabel>
                    <Input type="number" min="0" value={productForm.mrp} onChange={e => setProductForm(f => ({ ...f, mrp: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div>
                    <FieldLabel>Stock Quantity *</FieldLabel>
                    <Input type="number" min="0" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel>Unit</FieldLabel>
                    <Select value={productForm.unit} onChange={e => setProductForm(f => ({ ...f, unit: e.target.value }))}>
                      {["piece","kg","gm","litre","ml","metre","pair","set","dozen","pack"].map(u => <option key={u} value={u}>{u}</option>)}
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>State Code</FieldLabel>
                    <Select value={productForm.state_code} onChange={e => setProductForm(f => ({ ...f, state_code: e.target.value }))}>
                      <option value="">Inherit from store</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Tags (comma-separated)</FieldLabel>
                    <Input value={productForm.tags} onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))} placeholder="cotton, handloom, saree" />
                  </div>
                </div>
                <div className="mb-4">
                  <FieldLabel>Description *</FieldLabel>
                  <textarea value={productForm.description}
                    onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Describe your product in detail..."
                    className="w-full px-3 py-2 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                    style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)" }} />
                </div>

                {/* Image Upload */}
                <div className="mb-4">
                  <FieldLabel>Product Images (max 5)</FieldLabel>
                  <FileUploadZone value={productForm.images}
                    onChange={images => setProductForm(current => ({ ...current, images }))}
                    purpose="product-image" maxFiles={5} aspectRatio="1:1" label="Add product images" />
                  <p className="mt-2 text-[10px] text-[#111827]/35">The first image is used as the main product photo.</p>
                </div>

                {/* Specifications */}
                <div className="mb-5">
                  <FieldLabel>Product Specifications (optional)</FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "material",          label: "Material",           placeholder: "e.g. Pure Cotton" },
                      { key: "color",             label: "Color",              placeholder: "e.g. Indigo Blue" },
                      { key: "weight",            label: "Weight",             placeholder: "e.g. 500g" },
                      { key: "dimensions",        label: "Dimensions",         placeholder: "e.g. 30cm × 20cm" },
                      { key: "care_instructions", label: "Care Instructions",  placeholder: "e.g. Hand wash only" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className={key === "care_instructions" ? "col-span-2" : ""}>
                        <label className="text-[9.5px] font-bold uppercase tracking-widest text-[#111827]/30 block mb-1">{label}</label>
                        <Input
                          value={(productForm.specifications as any)[key]}
                          onChange={e => setProductForm(f => ({ ...f, specifications: { ...f.specifications, [key]: e.target.value } }))}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={saveProduct} disabled={savingProduct}
                    className="flex items-center gap-2 px-5 py-2 ag-btn-primary text-[12px] font-black rounded-xl ag-btn disabled:opacity-60">
                    <Check size={13} /> {savingProduct ? "Saving..." : editProduct ? "Save Changes" : "Submit for Approval"}
                  </button>
                  <button onClick={cancelProductForm}
                    className="px-5 py-2 text-[12px] font-semibold text-[#111827]/45 hover:bg-black/5 rounded-xl ag-btn transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Header row */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111827]/30 pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#111827] placeholder:text-[#111827]/30 focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                  style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.07)" }} />
              </div>
              <button onClick={openAddProduct}
                className="flex items-center gap-2 px-4 py-2 rounded-xl ag-btn-primary text-[12px] font-black ag-btn shrink-0">
                <Plus size={13} /> Add Product
              </button>
            </div>

            {/* Products table */}
            <div className="ag-card rounded-2xl overflow-hidden">
              {filteredProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <Package size={24} className="text-[#111827]/15 mx-auto mb-3" />
                  <p className="text-[12px] text-[#111827]/30 mb-4">No products listed yet</p>
                  <button onClick={openAddProduct} className="flex items-center gap-2 px-4 py-2 rounded-xl ag-btn-primary text-[12px] font-black ag-btn mx-auto">
                    <Plus size={13} /> Add your first product
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        {["Product","Price","Mode","Stock","Sales","Status","Actions"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p: any, i: number) => (
                        <tr key={p.id} className="ag-table-row" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ background: "rgba(250,204,21,0.12)" }}>
                                  <Package size={12} className="text-[#111827]" />
                                </div>
                              )}
                              <span className="font-bold text-[#111827] text-[12px] truncate max-w-[180px]">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 font-black text-[13px] text-[#111827]">{formatCurrency(p.price)}</td>
                          <td className="px-5 py-3">
                            <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full"
                              style={p.mode === "handmade"
                                ? { background: "rgba(5,150,105,0.09)", color: "#065f46" }
                                : { background: "rgba(37,99,235,0.09)", color: "#1d4ed8" }}>
                              {p.mode === "handmade" ? "Handcrafted" : "Contemporary Crafted"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {editStock?.id === p.id ? (
                              <div className="flex items-center gap-1.5">
                                <input type="number" min="0"
                                  value={editStock!.value}
                                  onChange={e => setEditStock({ id: p.id, value: e.target.value })}
                                  className="w-16 px-2 py-1 rounded-lg text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                                  style={{ border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.9)" }}
                                  autoFocus
                                />
                                <button onClick={() => saveStock(p.id)} className="w-6 h-6 rounded-md flex items-center justify-center ag-btn" style={{ background: "rgba(22,163,74,0.12)", color: "#15803d" }}>
                                  <Check size={10} />
                                </button>
                                <button onClick={() => setEditStock(null)} className="w-6 h-6 rounded-md flex items-center justify-center ag-btn" style={{ background: "rgba(220,38,38,0.08)", color: "#b91c1c" }}>
                                  <X size={10} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setEditStock({ id: p.id, value: String(p.stock) })}
                                className="flex items-center gap-1.5 ag-btn"
                                style={{ color: p.stock === 0 ? "#b91c1c" : p.stock <= 5 ? "#b45309" : "#111827" }}>
                                <span className="text-[12px] font-black">{p.stock}</span>
                                <Edit2 size={9} className="opacity-40" />
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-3 text-[12px] font-bold text-[#111827]/50">{p.sold_count || 0}</td>
                          <td className="px-5 py-3"><Pill status={p.approval_status} /></td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => setVariantProduct({ id: p.id, name: p.name })}
                                title="Manage variants"
                                className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                                style={{ background: "rgba(37,99,235,0.08)", color: "#1d4ed8" }}>
                                <Layers size={11} />
                              </button>
                              <button onClick={() => openEditProduct(p)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center ag-btn transition-colors"
                                style={{ background: "rgba(250,204,21,0.12)", color: "#111827" }}>
                                <Edit2 size={11} />
                              </button>
                              <button onClick={() => deleteProduct(p.id)}
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
                  <div className="px-5 py-3 text-[10.5px] text-[#111827]/25 font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                    {filteredProducts.length} of {products.length} products
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────── */}
        {/* ANALYTICS TAB                  */}
        {/* ─────────────────────────────── */}
        {tab === "analytics" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "This Month Revenue", value: formatCurrency(stats.monthlyRevenue || 0), sub: `${stats.monthlyOrders || 0} orders` },
                { label: "Products Live",       value: stats.activeProducts || 0,                  sub: `${stats.pendingProducts || 0} pending approval` },
                { label: "Avg Order Value",     value: formatCurrency(stats.averageOrderValue || 0), sub: "per transaction" },
              ].map(s => (
                <div key={s.label} className="ag-card-stat rounded-2xl p-5">
                  <p className="text-[24px] font-black text-[#111827] leading-none tracking-tight">{s.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#111827]/32 mt-2">{s.label}</p>
                  <p className="text-[10px] text-[#111827]/40 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Product performance */}
              <div className="ag-card rounded-2xl p-5">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30 mb-5">Product Performance</h2>
                {products.length === 0 ? (
                  <p className="text-[12px] text-[#111827]/30 text-center py-8">No products to display</p>
                ) : (
                  <div className="space-y-4">
                    {[...products].sort((a: any, b: any) => (b.sold_count || 0) - (a.sold_count || 0)).map((p: any, i: number) => {
                      const max = products.reduce((m: number, x: any) => Math.max(m, x.sold_count || 0), 1)
                      const pct = max > 0 ? Math.round(((p.sold_count || 0) / max) * 100) : 0
                      return (
                        <div key={p.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-black text-[#111827]/25 shrink-0">#{i + 1}</span>
                              <span className="text-[11px] font-semibold text-[#111827]/70 truncate">{p.name}</span>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <span className="text-[11px] font-black text-[#111827]">{p.sold_count || 0}</span>
                              <span className="text-[10px] text-[#111827]/35 ml-1">sold</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#FACC15", transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)" }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Stock health */}
              <div className="ag-card rounded-2xl p-5">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30 mb-5">Stock Health</h2>
                {products.length === 0 ? (
                  <p className="text-[12px] text-[#111827]/30 text-center py-8">No products</p>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: "Healthy (> 5)",  count: products.filter((p: any) => p.stock > 5).length,                     color: "#15803d", bg: "rgba(22,163,74,0.09)" },
                      { label: "Low (1–5)",       count: products.filter((p: any) => p.stock > 0 && p.stock <= 5).length,     color: "#b45309", bg: "rgba(217,119,6,0.09)" },
                      { label: "Out of Stock",    count: products.filter((p: any) => p.stock === 0).length,                   color: "#b91c1c", bg: "rgba(220,38,38,0.09)" },
                      { label: "Pending Review",  count: products.filter((p: any) => p.approval_status === "pending").length, color: "#6d28d9", bg: "rgba(124,58,237,0.09)" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: row.bg }}>
                        <span className="text-[12px] font-semibold" style={{ color: row.color }}>{row.label}</span>
                        <span className="text-[15px] font-black" style={{ color: row.color }}>{row.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order status */}
              <div className="ag-card rounded-2xl p-5">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30 mb-5">Order Status Breakdown</h2>
                {orders.length === 0 ? (
                  <p className="text-[12px] text-[#111827]/30 text-center py-8">No orders yet</p>
                ) : (() => {
                  const statusMap: Record<string, number> = {}
                  orders.forEach((o: any) => {
                    statusMap[o.order_status] = (statusMap[o.order_status] || 0) + 1
                  })
                  const total = orders.length
                  const COLOR: Record<string, string> = { delivered: "#15803d", shipped: "#6d28d9", confirmed: "#1d4ed8", processing: "#1d4ed8", pending: "#b45309", cancelled: "#b91c1c" }
                  return (
                    <div className="space-y-3">
                      {Object.entries(statusMap).map(([status, count]) => {
                        const pct = Math.round((count / total) * 100)
                        const color = COLOR[status] || "#475569"
                        return (
                          <div key={status}>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-[11px] font-bold capitalize" style={{ color }}>{status.replace(/_/g, " ")}</span>
                              <span className="text-[11px] font-black text-[#111827]">{count} <span className="text-[#111827]/35 font-medium">({pct}%)</span></span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Revenue split */}
              <div className="ag-card rounded-2xl p-5">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30 mb-5">Product Mode Split</h2>
                {products.length === 0 ? (
                  <p className="text-[12px] text-[#111827]/30 text-center py-8">No products</p>
                ) : (() => {
                  const hm = products.filter((p: any) => p.mode === "handmade").length
                  const mm = products.filter((p: any) => p.mode === "machine_made").length
                  const total = hm + mm
                  return (
                    <div className="space-y-4">
                      {[
                        { label: "Handmade",     value: hm, color: "#059669" },
                        { label: "Machine Made", value: mm, color: "#2563eb" },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="flex justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-[#111827]/70">{label}</span>
                            <span className="text-[11px] font-black text-[#111827]">{value} <span className="text-[#111827]/35">({total > 0 ? Math.round((value / total) * 100) : 0}%)</span></span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                            <div className="h-full rounded-full" style={{ width: `${total > 0 ? (value / total) * 100 : 0}%`, background: color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────── */}
        {/* EARNINGS TAB                   */}
        {/* ─────────────────────────────── */}
        {tab === "earnings" && (
          <div className="space-y-5">
            <div className="ag-card rounded-2xl p-6">
              <h2 className="text-[13px] font-black text-[#111827] mb-5">Earnings Breakdown</h2>
              <div className="space-y-2">
                {[
                  { label: "Gross Revenue",           value: earnings.grossRevenue || 0,        positive: true,  highlight: false },
                  { label: `Platform Commission (${earnings.commissionRate || "10%"})`, value: -(earnings.platformCommission || 0), positive: false, highlight: false },
                  { label: `Payment Gateway (${earnings.gatewayRate || "2%"})`,         value: -(earnings.paymentGatewayFee || 0),  positive: false, highlight: false },
                  { label: "Net Payable To You",       value: earnings.netPayable || 0,          positive: true,  highlight: true  },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-3 px-4 rounded-xl"
                    style={{ background: row.highlight ? "#FACC15" : "rgba(0,0,0,0.04)" }}>
                    <span className={`text-[12px] ${row.highlight ? "font-black text-[#111827]" : "font-medium text-[#111827]/70"}`}>{row.label}</span>
                    <span className={`font-black ${row.highlight ? "text-[#111827] text-[17px]" : row.positive ? "text-green-700 text-[13px]" : "text-red-600 text-[13px]"}`}>
                      {row.positive ? "" : "−"}{formatCurrency(Math.abs(row.value))}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#111827]/35 mt-4">Settlements processed T+7 days after delivery confirmation.</p>
            </div>

            {/* Order revenue breakdown by month */}
            <div className="ag-card rounded-2xl p-6">
              <h2 className="text-[13px] font-black text-[#111827] mb-5">Order Revenue Summary</h2>
              {orders.length === 0 ? (
                <p className="text-[12px] text-[#111827]/30 text-center py-8">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        {["Order","Amount","Platform Fee","Gateway Fee","Your Earnings","Status"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o: any, i: number) => {
                        const gross    = o.total || 0
                        const platformRate = parseFloat(earnings.commissionRate) || 10
                        const gatewayRate  = parseFloat(earnings.gatewayRate) || 2
                        const platform = Math.round(gross * (platformRate / 100))
                        const gateway  = Math.round(gross * (gatewayRate / 100))
                        const net      = gross - platform - gateway
                        return (
                          <tr key={o.id} className="ag-table-row" style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                            <td className="px-4 py-3 font-bold text-[#111827] text-[12px]">{o.order_number}</td>
                            <td className="px-4 py-3 font-black text-[13px]">{formatCurrency(gross)}</td>
                            <td className="px-4 py-3 text-[12px] text-red-600">−{formatCurrency(platform)}</td>
                            <td className="px-4 py-3 text-[12px] text-red-600">−{formatCurrency(gateway)}</td>
                            <td className="px-4 py-3 font-black text-[12px] text-green-700">{formatCurrency(net)}</td>
                            <td className="px-4 py-3"><Pill status={o.payment_status} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────── */}
        {/* SETTINGS TAB                   */}
        {/* ─────────────────────────────── */}
        {tab === "settings" && (
          <div className="space-y-5 max-w-2xl">
            <div className="ag-card rounded-2xl p-6">
              <h2 className="text-[13px] font-black text-[#111827] mb-5">Store Profile</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <FieldLabel>Business Name</FieldLabel>
                  <Input value={settingsForm.business_name} onChange={e => setSettingsForm(f => ({ ...f, business_name: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>Owner Name</FieldLabel>
                  <Input value={settingsForm.owner_name} onChange={e => setSettingsForm(f => ({ ...f, owner_name: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>City</FieldLabel>
                  <Input value={settingsForm.city} onChange={e => setSettingsForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>State</FieldLabel>
                  <Input value={settingsForm.state} onChange={e => setSettingsForm(f => ({ ...f, state: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Phone</FieldLabel>
                  <Input value={settingsForm.phone} onChange={e => setSettingsForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91XXXXXXXXXX" />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Store Description</FieldLabel>
                  <textarea value={settingsForm.description} onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Tell buyers about your craft and story..."
                    className="w-full px-3 py-2 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50"
                    style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)" }} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} className="pt-4 mt-2 mb-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#111827]/30 mb-3">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Account Number</FieldLabel>
                    <Input type="password" value={settingsForm.bank_account_number} onChange={e => setSettingsForm(f => ({ ...f, bank_account_number: e.target.value }))} placeholder="XXXXXXXXXXXX" />
                  </div>
                  <div>
                    <FieldLabel>IFSC Code</FieldLabel>
                    <Input value={settingsForm.bank_ifsc} onChange={e => setSettingsForm(f => ({ ...f, bank_ifsc: e.target.value }))} placeholder="SBIN0001234" />
                  </div>
                </div>
              </div>

              <button onClick={saveSettings} disabled={savingSettings}
                className="flex items-center gap-2 px-5 py-2 ag-btn-primary text-[12px] font-black rounded-xl ag-btn disabled:opacity-60">
                <Check size={13} /> {savingSettings ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Store info (read-only) */}
            <div className="ag-card rounded-2xl p-6">
              <h2 className="text-[13px] font-black text-[#111827] mb-4">Store Information</h2>
              <div className="space-y-3">
                {[
                  { label: "GSTIN",    value: seller.gstin    || "Not provided" },
                  { label: "PAN",      value: seller.pan      || "Not provided" },
                  { label: "Pincode",  value: seller.pincode  || "Not provided" },
                  { label: "Address",  value: seller.address  || "Not provided" },
                  { label: "Status",   value: seller.approval_status },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <span className="text-[11px] font-black uppercase tracking-wide text-[#111827]/35">{row.label}</span>
                    <span className="text-[12px] font-semibold text-[#111827]">{row.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#111827]/30 mt-4">To update GST/PAN or address, contact LoqMart support.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
