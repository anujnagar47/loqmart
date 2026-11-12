"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Heart, MessageSquarePlus, Star, ChevronDown, Loader2 } from "lucide-react"
import { useInquiryStore } from "@/lib/store"
import { useWishlist } from "@/hooks/useWishlist"
import type { Product } from "@/types/database"
import { IndiaMapPreview } from "@/components/map/IndiaMapPreview"

type StateFeedProduct = Product & { seller?: { business_name: string } | null }

const STATE_NAMES: Record<string, string> = {
  RJ:"Rajasthan", UP:"Uttar Pradesh", MH:"Maharashtra", WB:"West Bengal",
  KA:"Karnataka", TN:"Tamil Nadu", OR:"Odisha", AP:"Andhra Pradesh",
  GJ:"Gujarat", JK:"Jammu & Kashmir", KL:"Kerala", BR:"Bihar",
  MP:"Madhya Pradesh", PB:"Punjab", HR:"Haryana", DL:"Delhi",
}

function FeedItem({ item, index }: { item: StateFeedProduct; index: number }) {
  const router = useRouter()
  const addInquiry = useInquiryStore(s => s.addItem)
  const { toggleWishlist } = useWishlist()
  const [liked, setLiked] = useState(false)
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addInquiry(item)
  }

  const stateName = (item.state_code && STATE_NAMES[item.state_code]) || item.state_code || "India"
  const image     = item.images?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-[4px] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-[#111827]/5">
      <Link href={`/product/${item.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden group">
          {image ? (
            <Image src={image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-[#ffffff] flex items-center justify-center">
              <MessageSquarePlus className="w-10 h-10 text-[#111827]/20" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            {/* A plain span + router.push, not a nested <Link> — this badge
                sits inside the card's own product <Link>, and an <a> inside
                an <a> is invalid HTML that corrupts hydration (browsers
                silently break out of the outer anchor, which can visibly
                distort the surrounding layout). */}
            <span
              role="link"
              tabIndex={0}
              onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/state/${item.state_code?.toLowerCase()}`) }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); router.push(`/state/${item.state_code?.toLowerCase()}`) } }}
              className="bg-[#FACC15] text-[#111827] text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow hover:brightness-90 transition-all cursor-pointer"
            >
              <MapPin className="w-3 h-3" />{stateName}
            </span>
          </div>
          <span className={`absolute top-3 right-3 text-[9px] font-black uppercase px-2 py-1 rounded-full ${
            item.mode === "handmade" ? "bg-primary-container text-on-primary-fixed" : "bg-on-surface text-white"
          }`}>
            {item.mode === "handmade" ? "Handcrafted" : "Contemporary Crafted"}
          </span>
        </div>
      </Link>

      <div className="p-4">
        {item.seller && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#111827] truncate">{item.seller.business_name}</span>
            {item.rating > 0 && (
              <div className="flex items-center gap-1 text-xs text-[#111827]/50 shrink-0">
                <Star className="w-3 h-3 fill-[#FACC15] text-[#FACC15]" />
                <span className="font-bold text-[#111827]">{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        <Link href={`/product/${item.slug}`}>
          <h3 className="font-bold text-[#111827] text-sm leading-tight mb-2 hover:text-[#111827] transition-colors line-clamp-2">
            {item.name}
          </h3>
        </Link>

        {item.description && (
          <p className="text-xs text-[#111827]/50 italic leading-relaxed mb-3 border-l-2 border-[#FACC15]/60 pl-2.5 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.85 }}
              onClick={async (e) => { e.preventDefault(); const result = await toggleWishlist(item.id, liked); if (result !== null) setLiked(result) }}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                liked ? "bg-red-50 border-red-200" : "border-[#111827]/15 hover:bg-[#ffffff]"
              }`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-[#111827]/50"}`} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleAdd}
              className="flex items-center gap-1.5 rounded-[4px] bg-[#FACC15] px-3 py-2 text-xs font-bold text-[#111827] transition-colors hover:bg-[#EAB308]">
              <MessageSquarePlus className="h-3.5 w-3.5" /> Add to inquiry
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function StateFeed() {
  const [items,   setItems]   = useState<StateFeedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch("/api/products?craft_type=handcrafted&sort=rating_desc&limit=8")
      .then(r => r.json())
      .then(d => {
        const products = (d.products || []) as StateFeedProduct[]
        const withState = products.filter((product) => product.state_code)
        setItems(withState)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const visible = showAll ? items : items.slice(0, 4)

  return (
    <section className="bg-[#ffffff] px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-6 md:mb-8">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#111827]">State by state</span>
            <h2 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">From every corner of India</h2>
            <p className="mt-1 max-w-md text-sm leading-5 text-[#4B5563]">
              Browse products by the state their sellers call home.
            </p>
          </div>
          <Link href="/india-map" className="inline-flex min-h-10 shrink-0 items-center gap-2 text-sm font-semibold text-[#4B5563] transition-colors hover:text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EAB308]">
            Explore the India map <MapPin className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-[#111827]/30" /></div>
        ) : items.length === 0 ? (
          <div className="grid min-h-[320px] overflow-hidden border border-[#E5E7EB] bg-white lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex flex-col justify-center border-b border-[#e8e4da] p-5 sm:p-7 lg:border-b-0 lg:border-r">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#111827]">Browse by location</span>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">Choose a state to explore</h3>
              <p className="mt-2 max-w-sm text-sm leading-5 text-[#4B5563]">Select a region on the map to see its sellers and products.</p>
            </div>
            <div className="flex min-h-[260px] items-center justify-center px-2 py-4 sm:px-6 lg:min-h-[320px]">
              <IndiaMapPreview />
            </div>
          </div>
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
                  className="inline-flex items-center gap-2 bg-white border border-[#111827]/15 text-[#111827]/60 px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider hover:border-[#FACC15] hover:text-[#111827] transition-all">
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
