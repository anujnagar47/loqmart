"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Package, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/types/database"

const tabs = ["Overall", "Handcrafted", "Contemporary Crafted"]

export default function BestSellersPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const controller = new AbortController()
    const params = new URLSearchParams({ sort: "sold_desc", limit: "24" })
    if (activeTab === 1) params.set("craft_type", "handcrafted")
    if (activeTab === 2) params.set("craft_type", "contemporary")
    fetch(`/api/products?${params}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("catalogue unavailable"); return response.json() })
      .then(data => setProducts(data.products || []))
      .catch(err => { if (err.name !== "AbortError") setError(true) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [activeTab, retry])

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="bg-[#FACC15] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-[#111827]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#111827]/60">Trending</span>
          </div>
          <h1 className="text-5xl font-extrabold text-[#111827] tracking-tight">Best Sellers</h1>
          <p className="text-[#111827]/75 mt-3 text-lg">Popular products, ranked by sales.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === i
                  ? "bg-[#111827] text-[#FACC15]"
                : "bg-white border border-[#111827]/10 text-on-surface-variant hover:border-[#111827]/30"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-4 flex-wrap mb-8">
          <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-2 border border-[#111827]/8">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-[#111827]">Sorted by sales</span>
          </div>
          {!loading && !error && (
            <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-2 border border-[#111827]/8">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-[#111827]">{products.length} products</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#111827]/30" />
          </div>
        ) : error ? (
          <div role="alert" className="text-center py-20">
            <AlertCircle className="w-9 h-9 text-on-surface-variant mx-auto mb-3" />
            <p className="text-lg font-bold text-on-surface">Best sellers are temporarily unavailable</p>
            <p className="text-sm text-on-surface-variant mt-2">Please try again shortly.</p>
            <button onClick={() => setRetry(value => value + 1)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-fixed text-sm font-semibold">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl font-bold text-on-surface">No best sellers to show yet</p>
            <p className="text-sm text-on-surface-variant mt-2">Try another category or browse all products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {products.map((product, i) => (
              <motion.div key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className="relative">
                <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-[#111827] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-[#FACC15] text-xs font-black">#{i + 1}</span>
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
