"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Heart, ShoppingCart, Star, ChevronDown, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useCartStore } from "@/lib/store"

const STATE_NAMES: Record<string, string> = {
  RJ:"Rajasthan", UP:"Uttar Pradesh", MH:"Maharashtra", WB:"West Bengal",
  KA:"Karnataka", TN:"Tamil Nadu", OR:"Odisha", AP:"Andhra Pradesh",
  GJ:"Gujarat", JK:"Jammu & Kashmir", KL:"Kerala", BR:"Bihar",
  MP:"Madhya Pradesh", PB:"Punjab", HR:"Haryana", DL:"Delhi",
}

function FeedItem({ item, index }: { item: any; index: number }) {
  const { addItem } = useCartStore()
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  const stateName = STATE_NAMES[item.state_code] || item.state_code || "India"
  const image     = item.images?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-[#1a1c1c]/5">
      <Link href={`/product/${item.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden group">
          {image ? (
            <img src={image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-[#f8f5f0] flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-[#1a1c1c]/20" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Link href={`/state/${item.state_code?.toLowerCase()}`} onClick={e => e.stopPropagation()}>
              <span className="bg-[#fcd020] text-[#231b00] text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow hover:brightness-90 transition-all">
                <MapPin className="w-3 h-3" />{stateName}
              </span>
            </Link>
          </div>
          <span className={`absolute top-3 right-3 text-[9px] font-black uppercase px-2 py-1 rounded-full ${
            item.mode === "handmade" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
          }`}>
            {item.mode === "handmade" ? "Handmade" : "Machine Made"}
          </span>
        </div>
      </Link>

      <div className="p-4">
        {item.seller && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#725c00] truncate">{item.seller.business_name}</span>
            {item.rating > 0 && (
              <div className="flex items-center gap-1 text-xs text-[#1a1c1c]/50 shrink-0">
                <Star className="w-3 h-3 fill-[#fcd020] text-[#fcd020]" />
                <span className="font-bold text-[#1a1c1c]">{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        <Link href={`/product/${item.slug}`}>
          <h3 className="font-bold text-[#1a1c1c] text-sm leading-tight mb-2 hover:text-[#725c00] transition-colors line-clamp-2">
            {item.name}
          </h3>
        </Link>

        {item.description && (
          <p className="text-xs text-[#1a1c1c]/50 italic leading-relaxed mb-3 border-l-2 border-[#fcd020]/60 pl-2.5 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-extrabold text-[#1a1c1c] text-base">{formatCurrency(item.price)}</span>
            {item.mrp && item.mrp > item.price && (
              <span className="ml-1.5 text-xs text-[#1a1c1c]/40 line-through">{formatCurrency(item.mrp)}</span>
            )}
          </div>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.preventDefault(); setLiked(!liked) }}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                liked ? "bg-red-50 border-red-200" : "border-[#1a1c1c]/15 hover:bg-[#f8f5f0]"
              }`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-[#1a1c1c]/50"}`} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleAdd}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                added ? "bg-green-500 text-white" : "bg-[#fcd020] text-[#1a1c1c] hover:brightness-95"
              }`}>
              <ShoppingCart className="w-3 h-3" />
              {added ? "Added!" : "Add"}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function StateFeed() {
  const [items,   setItems]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch("/api/products?mode=handmade&sort=rating_desc&limit=8")
      .then(r => r.json())
      .then(d => {
        const withState = (d.products || []).filter((p: any) => p.state_code)
        setItems(withState)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const visible = showAll ? items : items.slice(0, 4)

  return (
    <section className="py-10 md:py-20 px-4 md:px-20 bg-[#f3f3f3]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/40 block mb-3">State by State</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-[#1a1c1c]">From Every Corner of India</h2>
            <p className="text-[#1a1c1c]/50 mt-2 text-sm max-w-md">
              Products tagged by their state of origin. Every maker verified. Every craft documented.
            </p>
          </div>
          <Link href="/india-map" className="text-[#1a1c1c]/50 font-bold text-sm uppercase tracking-widest hover:text-[#1a1c1c] transition-colors whitespace-nowrap">
            Explore India Map →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-[#1a1c1c]/30" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-[#1a1c1c]/40 py-12 font-medium">Products loading soon from our sellers.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              <AnimatePresence>
                {visible.map((item, i) => <FeedItem key={item.id} item={item} index={i} />)}
              </AnimatePresence>
            </div>

            {!showAll && items.length > 4 && (
              <div className="text-center mt-10">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAll(true)}
                  className="inline-flex items-center gap-2 bg-white border border-[#1a1c1c]/15 text-[#1a1c1c]/60 px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider hover:border-[#fcd020] hover:text-[#1a1c1c] transition-all">
                  <ChevronDown className="w-4 h-4" /> Load More from India
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
