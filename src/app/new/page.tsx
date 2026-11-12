"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, Grid, List, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/types/database"

export default function NewArrivalsPage() {
  const [mode,     setMode]     = useState<"all" | "handmade" | "machine_made">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const controller = new AbortController()
    const params = new URLSearchParams({ sort: "created_at_desc", limit: "32" })
    if (mode === "handmade") params.set("craft_type", "handcrafted")
    if (mode === "machine_made") params.set("craft_type", "contemporary")
    fetch(`/api/products?${params}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("catalogue unavailable")
        return response.json()
      })
      .then(data => setProducts(data.products || []))
      .catch(err => { if (err.name !== "AbortError") setError(true) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [mode, retry])

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="bg-[#FACC15] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-[#111827]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#111827]/60">Just In</span>
          </div>
          <h1 className="text-5xl font-extrabold text-[#111827] tracking-tight">New Arrivals</h1>
          <p className="text-[#111827]/60 mt-3 text-lg">Recently listed products from sellers across India.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex gap-2">
            {(["all", "handmade", "machine_made"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  mode === m
                    ? "bg-[#111827] text-[#FACC15]"
                    : "bg-white border border-[#111827]/10 text-[#111827]/60 hover:border-[#111827]/30"
                }`}>
                {m === "all" ? "All" : m === "handmade" ? "Handcrafted" : "Contemporary Crafted"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#111827]/50">{loading ? "…" : `${products.length} products`}</span>
            <div className="flex gap-1 bg-white border border-[#111827]/10 rounded-lg p-1">
              {[["grid", Grid], ["list", List]].map(([v, Icon]: any) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === v ? "bg-[#FACC15]" : "hover:bg-[#ffffff]"}`}>
                  <Icon className="w-4 h-4 text-[#111827]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black text-[#111827]"
            style={{ background: "#FACC15" }}>Latest listings</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold text-[#111827]"
            style={{ border: "1px solid rgba(17,24,39,0.2)" }}>Browse by seller location</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#111827]/30" />
          </div>
        ) : error ? (
          <div role="alert" className="text-center py-20 border border-[#E5E7EB] bg-white rounded-lg">
            <AlertCircle className="w-8 h-8 text-[#111827] mx-auto mb-3" />
            <p className="text-lg font-bold text-[#111827]">New arrivals are temporarily unavailable</p>
            <p className="text-sm text-[#4B5563] mt-2">Please try again in a moment.</p>
            <button onClick={() => setRetry(value => value + 1)} className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-[#111827] text-sm font-semibold rounded">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl font-bold text-[#111827]/40">No new products yet</p>
            <p className="text-sm text-[#111827]/30 mt-2">Check back soon - sellers add new products daily.</p>
          </div>
        ) : (
          <div className={`grid gap-3 sm:gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-1"}`}>
            {products.map((product, i) => (
              <motion.div key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className="relative">
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="bg-[#FACC15] text-[#111827] text-[10px] font-bold uppercase px-2 py-1 rounded-full shadow-sm">New</span>
                </div>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
