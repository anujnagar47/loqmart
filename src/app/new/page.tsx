"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, Grid, List, Loader2 } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { createClient } from "@/lib/supabase/client"
import type { Product } from "@/types/database"

export default function NewArrivalsPage() {
  const [mode,     setMode]     = useState<"all" | "handmade" | "machine_made">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from("products")
      .select("*, sellers(id, business_name, swadeshi_rank, state_code)")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
      .limit(32)

    if (mode !== "all") query = query.eq("mode", mode)

    query.then(({ data }) => {
      setProducts(data || [])
      setLoading(false)
    })
  }, [mode])

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#fcd020] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-[#1a1c1c]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/60">Just In</span>
          </div>
          <h1 className="text-5xl font-extrabold text-[#1a1c1c] tracking-tight">New Arrivals</h1>
          <p className="text-[#1a1c1c]/60 mt-3 text-lg">Freshly listed by verified Indian sellers. Updated daily.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex gap-2">
            {(["all", "handmade", "machine_made"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  mode === m
                    ? "bg-[#1a1c1c] text-[#fcd020]"
                    : "bg-white border border-[#1a1c1c]/10 text-[#1a1c1c]/60 hover:border-[#1a1c1c]/30"
                }`}>
                {m === "all" ? "All" : m === "handmade" ? "Handmade" : "Machine Made"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#1a1c1c]/50">{loading ? "…" : `${products.length} products`}</span>
            <div className="flex gap-1 bg-white border border-[#1a1c1c]/10 rounded-lg p-1">
              {[["grid", Grid], ["list", List]].map(([v, Icon]: any) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === v ? "bg-[#fcd020]" : "hover:bg-[#f8f5f0]"}`}>
                  <Icon className="w-4 h-4 text-[#1a1c1c]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black text-[#231b00]"
            style={{ background: "#fcd020" }}>Latest listings</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold text-[#1a1c1c]"
            style={{ border: "1px solid rgba(26,28,28,0.2)" }}>GST Verified sellers only</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a1c1c]/30" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl font-bold text-[#1a1c1c]/40">No new products yet</p>
            <p className="text-sm text-[#1a1c1c]/30 mt-2">Check back soon - sellers add new products daily.</p>
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
                  <span className="bg-green-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shadow">New</span>
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
