"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Heart, MapPin, Check, Star, ImageOff, Truck, Store } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Product } from "@/types/database"
import { useCartStore } from "@/lib/store"
import { useWishlist } from "@/hooks/useWishlist"

interface ProductCardProps {
  product: Product
  /** Set when a corner ribbon (rank number / "New") is overlaid by the parent — shifts the card's own corner elements out of the way. */
  cornerBadge?: "rank" | "new"
}

const STATE_NAMES: Record<string, string> = {
  RJ: "Rajasthan", UP: "Uttar Pradesh", MH: "Maharashtra", WB: "West Bengal",
  KA: "Karnataka", TN: "Tamil Nadu", OR: "Odisha", OD: "Odisha", AP: "Andhra Pradesh",
  GJ: "Gujarat", KL: "Kerala", DL: "Delhi", PB: "Punjab", HR: "Haryana",
  MP: "Madhya Pradesh", BR: "Bihar", JK: "J&K", AS: "Assam", JH: "Jharkhand",
  CT: "Chhattisgarh", HP: "Himachal", UK: "Uttarakhand", TG: "Telangana",
  GA: "Goa", MN: "Manipur", TR: "Tripura", ML: "Meghalaya", MZ: "Mizoram",
  NL: "Nagaland", SK: "Sikkim", AR: "Arunachal", LA: "Ladakh",
}

export function ProductCard({ product, cornerBadge }: ProductCardProps) {
  const { addItem } = useCartStore()
  const { toggleWishlist, wishlistPendingId } = useWishlist()
  const [isAdding,   setIsAdding]   = React.useState(false)
  const [isWished,   setIsWished]   = React.useState(false)
  const [isHovered,  setIsHovered]  = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock <= 0) return
    setIsAdding(true)
    addItem(product)
    setTimeout(() => setIsAdding(false), 1000)
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const result = await toggleWishlist(product.id, isWished)
    if (result !== null) setIsWished(result)
  }

  const discount = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0
  const image    = product.images?.[0]
  const inStock  = product.stock > 0
  const lowStock = inStock && product.stock <= 10
  const sellerName = product.sellers?.business_name

  return (
    <Link href={`/product/${product.slug}`} className="block h-full">
      <article
        className="group relative bg-white rounded-[4px] overflow-hidden cursor-pointer border border-[#1a1c1c]/10 transition-shadow hover:shadow-[0_2px_10px_rgba(26,28,28,0.12)] h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[#f8f5f0]">
          {image && !imageError ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-[#f8f5f0]">
              <ImageOff className="w-6 h-6 text-[#1a1c1c]/15" />
              <span className="text-[9px] font-semibold text-[#1a1c1c]/25 uppercase tracking-wide">No image</span>
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 bg-white/55 flex items-center justify-center">
              <span className="bg-[#1a1c1c] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-[3px]">
                Out of Stock
              </span>
            </div>
          )}

          {/* Badges top-left */}
          <div className={`absolute left-2 flex flex-col gap-1 ${cornerBadge === "rank" ? "top-7" : "top-2"}`}>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-[3px] ${
              product.mode === "handmade"
                ? "bg-[#fcd020] text-[#231b00]"
                : "bg-[#1a1c1c] text-white"
            }`}>
              {product.mode === "handmade" ? "Handmade" : "Machine Made"}
            </span>
            {product.state_code && (
              <span className="bg-white/90 text-[#1a1c1c] text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {STATE_NAMES[product.state_code] || product.state_code}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            disabled={wishlistPendingId === product.id}
            className={`absolute right-2 w-7 h-7 bg-white/95 rounded-[3px] flex items-center justify-center shadow-sm disabled:opacity-60 ${cornerBadge === "new" ? "top-7" : "top-2"}`}
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${isWished ? "fill-red-500 text-red-500" : "text-[#1a1c1c]/50"}`} />
          </button>

          {/* Add to cart — hover-reveal on desktop, always visible on mobile */}
          {inStock && (
            <div className={`absolute inset-x-0 bottom-0 hidden sm:block transition-all duration-150 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
            }`}>
              <Button
                type="button"
                onClick={handleAddToCart}
                size="sm"
                className={`w-full rounded-none border-x-0 border-b-0 ${isAdding ? "!bg-green-500 !text-white !border-transparent" : ""}`}
              >
                <AnimatePresence mode="wait">
                  {isAdding ? (
                    <motion.span key="check" className="flex items-center gap-1"
                      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                      <Check className="w-3 h-3" /> Added
                    </motion.span>
                  ) : (
                    <motion.span key="cart" className="flex items-center gap-1"
                      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                      <ShoppingCart className="w-3 h-3" /> Add to Cart
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1">
          <h2 className="text-[12.5px] sm:text-sm font-medium tracking-tight text-[#1a1c1c] leading-snug line-clamp-2 mb-1 min-h-[2.5em] sm:min-h-[2.4em]">
            {product.name}
          </h2>

          <div className="min-h-[18px] mb-1">
          {(product.rating > 0 || (product.sold_count || 0) > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-[#fcd020] text-[#fcd020]" />
                  <span className="text-[11px] font-semibold text-[#1a1c1c]">{product.rating.toFixed(1)}</span>
                  {product.review_count > 0 && (
                    <span className="text-[10.5px] text-[#0a6ac9]">({product.review_count})</span>
                  )}
                </span>
              )}
              {(product.sold_count || 0) > 0 && (
                <span className="text-[10px] text-[#1a1c1c]/40">{product.sold_count.toLocaleString()} bought</span>
              )}
            </div>
          )}
          </div>

          <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
            <span className="font-bold text-[#1a1c1c] text-[15px] sm:text-base">{formatCurrency(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="text-[11px] text-[#1a1c1c]/45 line-through">{formatCurrency(product.mrp)}</span>
                <span className="text-[11px] text-red-700 font-semibold">({discount}% off)</span>
              </>
            )}
          </div>

          <div className="min-h-[16px] mb-1">
          {sellerName && (
            <div className="flex items-center gap-1 min-w-0">
              <Store className="w-2.5 h-2.5 text-[#1a1c1c]/30 shrink-0" />
              <span className="text-[10px] text-[#1a1c1c]/40 truncate">{sellerName}</span>
            </div>
          )}
          </div>

          <div className="flex-1" />

          {inStock ? (
            <div className="flex items-center gap-2 flex-wrap">
              {product.price > 999 ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700">
                  <Truck className="w-2.5 h-2.5" /> Free delivery
                </span>
              ) : lowStock ? null : (
                <span className="flex items-center gap-1 text-[10px] text-[#1a1c1c]/35">
                  <Truck className="w-2.5 h-2.5" /> Delivery at checkout
                </span>
              )}
              {lowStock && (
                <span className="text-[10px] font-bold text-orange-600">Only {product.stock} left</span>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-bold text-red-600">Out of stock</span>
          )}

          {/* Mobile Add to Cart — visible on touch, hidden on desktop (uses hover button instead) */}
          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            size="sm"
            className={`sm:hidden w-full mt-2 ${isAdding ? "!bg-green-500 !text-white !border-transparent" : ""}`}
          >
            {!inStock ? "Out of Stock" : isAdding ? <><Check className="w-3 h-3" /> Added!</> : <><ShoppingCart className="w-3 h-3" /> Add to Cart</>}
          </Button>
        </div>
      </article>
    </Link>
  )
}
