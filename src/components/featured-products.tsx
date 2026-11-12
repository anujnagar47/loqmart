"use client"

import Link from "next/link"
import { ArrowRight, Loader2, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { ProductCard } from "@/components/product-card"
import { useLanguage } from "@/lib/i18n/LanguageContext"
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
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch("/api/products?limit=8&sort=rating_desc")
      .then(r => { if (!r.ok) throw new Error("catalogue unavailable"); return r.json() })
      .then(d => { setProducts(d.products || []) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [retry])

  return (
    <section className="py-10 md:py-20 px-4 md:px-20 bg-[#ffffff]">
      <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-8 mb-8 md:mb-12">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#111827]/40 block mb-3">{t("featured.eyebrow")}</span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#111827]">
            {t("featured.titleLine1")}<br /><span className="text-[#111827]">{t("featured.titleLine2")}</span>
          </h2>
          <p className="text-[#111827]/50 text-sm mt-2 max-w-md">{t("featured.subtitle")}</p>
        </div>
        <Link href="/category" className="flex items-center gap-2 text-[#111827]/50 font-bold text-sm uppercase tracking-widest hover:text-[#111827] transition-colors group whitespace-nowrap">
          {t("common.viewAll")}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#111827]/40" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-[#111827]/40">
          <p className="font-medium">{t("featured.unavailable")}</p>
          <p className="text-sm mt-1">{t("featured.checkBack")}</p>
          <button onClick={() => setRetry(value => value + 1)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-[#111827] text-sm font-semibold rounded-[4px]">
            <RefreshCw className="w-4 h-4" /> {t("featured.retry")}
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-[#111827]/40">
          <p className="font-medium">{t("featured.empty")}</p>
          <p className="text-sm mt-1">{t("featured.checkBack")}</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4"
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
