"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Award, Star, Loader2 } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { createClient } from "@/lib/supabase/client"
import type { Product } from "@/types/database"

const tabs = ["Overall", "Handmade", "Machine Made"]

export default function BestSellersPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from("products")
      .select("*")
      .eq("approval_status", "approved")
      .order("sold_count", { ascending: false })
      .limit(24)

    if (activeTab === 1) query = query.eq("mode", "handmade")
    if (activeTab === 2) query = query.eq("mode", "machine_made")

    query.then(({ data }) => {
      setProducts(data || [])
      setLoading(false)
    })
  }, [activeTab])

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#fcd020] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-[#1a1c1c]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/60">Trending</span>
          </div>
          <h1 className="text-5xl font-extrabold text-[#1a1c1c] tracking-tight">Best Sellers</h1>
          <p className="text-[#1a1c1c]/60 mt-3 text-lg">India's most-loved products - ranked by orders, reviews and Swadeshi Rank.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === i
                  ? "bg-[#1a1c1c] text-[#fcd020]"
                  : "bg-white border border-[#1a1c1c]/10 text-[#1a1c1c]/60 hover:border-[#1a1c1c]/30"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-4 flex-wrap mb-8">
          <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-2 border border-[#1a1c1c]/8">
            <Award className="w-4 h-4 text-[#fcd020]" />
            <span className="text-sm font-bold text-[#1a1c1c]">Swadeshi Ranked sellers only</span>
          </div>
          {!loading && (
            <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-2 border border-[#1a1c1c]/8">
              <Star className="w-4 h-4 text-[#fcd020] fill-[#fcd020]" />
              <span className="text-sm font-bold text-[#1a1c1c]">{products.length} products</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a1c1c]/30" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl font-bold text-[#1a1c1c]/40">No products yet</p>
            <p className="text-sm text-[#1a1c1c]/30 mt-2">Products will appear here once sellers list them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className="relative">
                <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-[#1a1c1c] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-[#fcd020] text-xs font-black">#{i + 1}</span>
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
