"use client"

import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/types/database"

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch("/api/products?limit=8&sort=rating_desc")
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section className="py-10 md:py-20 px-4 md:px-20 bg-[#f8f5f0]">
      <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-8 mb-8 md:mb-12">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/40 block mb-3">Discovery Engine</span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#1a1c1c]">
            Curated for<br /><span className="text-[#725c00]">the Discerning</span>
          </h2>
          <p className="text-[#1a1c1c]/50 text-sm mt-2 max-w-md">Top-rated products from verified Indian makers - filtered by quality, not by algorithm.</p>
        </div>
        <Link href="/category" className="flex items-center gap-2 text-[#1a1c1c]/50 font-bold text-sm uppercase tracking-widest hover:text-[#1a1c1c] transition-colors group whitespace-nowrap">
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a1c1c]/40" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-[#1a1c1c]/40">
          <p className="font-medium">Products loading soon.</p>
          <p className="text-sm mt-1">Check back after the catalogue is published.</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}
      </div>
    </section>
  )
}
