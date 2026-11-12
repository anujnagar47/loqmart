"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ImageOff, MapPin, MessageSquarePlus, Star, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/types/database"
import { useInquiryStore } from "@/lib/store"
import { isGuestWishlisted, useWishlist } from "@/hooks/useWishlist"

interface ProductCardProps {
  product: Product
  cornerBadge?: "rank" | "new"
}

const STATE_NAMES: Record<string, string> = {
  RJ: "Rajasthan", UP: "Uttar Pradesh", MH: "Maharashtra", WB: "West Bengal", KA: "Karnataka", TN: "Tamil Nadu", OR: "Odisha", OD: "Odisha", AP: "Andhra Pradesh", GJ: "Gujarat", KL: "Kerala", DL: "Delhi", PB: "Punjab", HR: "Haryana", MP: "Madhya Pradesh", BR: "Bihar", JK: "J&K", AS: "Assam", JH: "Jharkhand", CT: "Chhattisgarh", HP: "Himachal Pradesh", UK: "Uttarakhand", TG: "Telangana", GA: "Goa", MN: "Manipur", TR: "Tripura", ML: "Meghalaya", MZ: "Mizoram", NL: "Nagaland", SK: "Sikkim", AR: "Arunachal Pradesh", LA: "Ladakh",
}

export function ProductCard({ product, cornerBadge }: ProductCardProps) {
  const addInquiry = useInquiryStore(s => s.addItem)
  const { toggleWishlist, wishlistPendingId } = useWishlist()
  const [isWished, setIsWished] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)
  React.useEffect(() => setIsWished(isGuestWishlisted(product.id)), [product.id])

  const handleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation()
    const value = await toggleWishlist(product.id, isWished)
    if (value !== null) setIsWished(value)
  }
  const handleInquiry = (event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation()
    addInquiry(product)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[4px] border border-[#111827]/10 bg-white transition-shadow hover:shadow-[0_2px_10px_rgba(17,24,39,0.12)]">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-white" aria-label={`View ${product.name}`}>
        {product.images?.[0] && !imageError ? <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" onError={() => setImageError(true)} /> : <div className="flex h-full w-full flex-col items-center justify-center gap-1"><ImageOff className="h-6 w-6 text-[#111827]/15" /><span className="text-[9px] font-semibold uppercase tracking-wide text-[#111827]/25">No image</span></div>}
        {product.stock <= 0 && <div className="absolute inset-0 flex items-center justify-center bg-white/55"><span className="rounded-[3px] bg-[#111827] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">Availability on request</span></div>}
        <div className={`absolute left-2 flex flex-col gap-1 ${cornerBadge === "rank" ? "top-7" : "top-2"}`}>
          <span className={`rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold uppercase ${product.mode === "handmade" ? "bg-[#FACC15] text-[#111827]" : "bg-[#111827] text-white"}`}>{product.mode === "handmade" ? "Handcrafted" : "Contemporary"}</span>
          {product.state_code && <span className="flex items-center gap-1 rounded-[3px] bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-[#111827]"><MapPin className="h-2.5 w-2.5" />{STATE_NAMES[product.state_code] || product.state_code}</span>}
        </div>
        <button onClick={handleWishlist} disabled={wishlistPendingId === product.id} aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"} className={`absolute right-2 rounded-[3px] bg-white/95 p-1.5 shadow-sm disabled:opacity-60 ${cornerBadge === "new" ? "top-7" : "top-2"}`}><Heart className={`h-4 w-4 ${isWished ? "fill-red-500 text-red-500" : "text-[#111827]/55"}`} /></button>
      </Link>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <Link href={`/product/${product.slug}`} className="mb-2 line-clamp-2 min-h-[2.5em] text-[12.5px] font-medium leading-snug tracking-tight text-[#111827] hover:underline sm:text-sm">{product.name}</Link>
        <div className="mb-2 flex min-h-5 flex-wrap items-center gap-1">
          <span title="Production method follows the product listing; certification marks are reviewed separately." className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4 ${product.mode === "handmade" ? "bg-amber-100 text-amber-900" : "bg-[#eeeeee] text-[#4d4632]"}`}>{product.mode === "handmade" ? `Handcrafted${product.state_code ? ` · ${STATE_NAMES[product.state_code] || product.state_code}` : ""}` : "Contemporary Crafted"}</span>
          {(product.tags || []).includes("gi-certified") && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold leading-4 text-emerald-800">GI-Certified Origin</span>}
          {(product.tags || []).includes("handloom-certified") && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold leading-4 text-amber-900">Handloom Certified</span>}
        </div>
        <div className="min-h-5">
          {(product.rating > 0 || product.sellers?.business_name) && <div className="flex items-center gap-1.5 text-[10px] text-[#4d4632]">
            {product.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-[#FACC15] text-[#FACC15]" /><b className="text-[#111827]">{product.rating.toFixed(1)}</b>{product.review_count > 0 && <span>({product.review_count})</span>}</span>}
            {product.sellers?.business_name && <span className="flex min-w-0 items-center gap-1 truncate"><Store className="h-2.5 w-2.5 shrink-0" />{product.sellers.business_name}</span>}
          </div>}
        </div>
        <div className="flex-1" />
        <Button type="button" size="sm" onClick={handleInquiry} className="mt-3 w-full rounded-[4px]">
          <MessageSquarePlus className="h-3.5 w-3.5" /> Add to Inquiry
        </Button>
      </div>
    </article>
  )
}
