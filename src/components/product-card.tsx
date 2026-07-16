"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Heart, MapPin, Check, Star } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/types/database"
import { useCartStore } from "@/lib/store"

interface ProductCardProps {
  product: Product
  onWishlist?: () => void
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

export function ProductCard({ product, onWishlist }: ProductCardProps) {
  const { addItem } = useCartStore()
  const [isAdding,  setIsAdding]  = React.useState(false)
  const [isWished,  setIsWished]  = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAdding(true)
    addItem(product)
    setTimeout(() => setIsAdding(false), 1000)
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWished(!isWished)
    onWishlist?.()
  }

  const discount = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0
  const image    = product.images?.[0]

  return (
    <Link href={`/product/${product.slug}`}>
      <motion.article
        className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer border border-[#1a1c1c]/5"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{
          y: -6,
          boxShadow: "0 20px 60px rgba(26,28,28,0.12)",
          transition: { duration: 0.25, ease: "easeOut" }
        }}
        initial={{ boxShadow: "0 2px 8px rgba(26,28,28,0.06)" }}
      >
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f8f5f0]">
          {image ? (
            <motion.img
              src={image}
              alt={product.name}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.06 : 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f8f5f0]">
              <ShoppingCart className="w-10 h-10 text-[#1a1c1c]/20" />
            </div>
          )}

          {/* Badges top-left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm shadow-sm ${
              product.mode === "handmade"
                ? "bg-[#fcd020] text-[#231b00]"
                : "bg-[#1a1c1c] text-white"
            }`}>
              {product.mode === "handmade" ? "Handmade" : "Machine Made"}
            </span>
            {product.state_code && (
              <span className="bg-white/90 text-[#1a1c1c] text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-sm backdrop-blur-sm">
                <MapPin className="w-2.5 h-2.5" />
                {STATE_NAMES[product.state_code] || product.state_code}
              </span>
            )}
          </div>

          {/* Discount badge */}
          {discount > 0 && (
            <motion.span
              className="absolute top-3 right-10 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              -{discount}%
            </motion.span>
          )}

          {/* Wishlist — always visible */}
          <motion.button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md"
            whileTap={{ scale: 0.8 }}
          >
            <Heart className={`w-4 h-4 transition-colors ${isWished ? "fill-red-500 text-red-500" : "text-[#1a1c1c]/50"}`} />
          </motion.button>

          {/* Add to cart — hover-reveal on desktop, always visible on mobile */}
          <motion.button
            onClick={handleAddToCart}
            className={`absolute bottom-3 right-3 hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide shadow-md transition-colors ${
              isAdding ? "bg-green-500 text-white" : "bg-[#fcd020] text-[#1a1c1c] hover:brightness-95"
            }`}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
            transition={{ duration: 0.2 }}
            whileTap={{ scale: 0.92 }}
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
                  <ShoppingCart className="w-3 h-3" /> Add
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Units sold */}
          {(product.sold_count || 0) > 0 && (
            <span className="absolute bottom-3 left-3 text-[9px] text-white/80 bg-black/35 backdrop-blur-sm px-1.5 py-0.5 rounded font-medium">
              {product.sold_count.toLocaleString()} bought
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h2 className="text-sm font-bold tracking-tight text-[#1a1c1c] leading-snug line-clamp-2 flex-1">
              {product.name}
            </h2>
            <span className="font-extrabold text-[#725c00] text-sm whitespace-nowrap">{formatCurrency(product.price)}</span>
          </div>

          {product.mrp && product.mrp > product.price && (
            <p className="text-[10px] text-[#4d4632] mb-1.5">
              <span className="line-through">MRP {formatCurrency(product.mrp)}</span>
              <span className="ml-1 text-green-700 font-semibold">{discount}% off</span>
            </p>
          )}

          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-[#fcd020] text-[#fcd020]" />
              <span className="text-[10px] font-bold text-[#1a1c1c]">{product.rating.toFixed(1)}</span>
              {product.review_count > 0 && (
                <span className="text-[10px] text-[#1a1c1c]/40">({product.review_count})</span>
              )}
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {product.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[9px] font-bold uppercase border border-[#d0c6ac]/60 px-1.5 py-0.5 rounded-sm text-[#4d4632]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Mobile Add to Cart — visible on touch, hidden on desktop (uses hover button instead) */}
          <button onClick={handleAddToCart}
            className={`sm:hidden w-full mt-2.5 py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors ${
              isAdding ? "bg-green-500 text-white" : "bg-[#fcd020] text-[#1a1c1c]"
            }`}>
            {isAdding ? <><Check className="w-3 h-3" /> Added!</> : <><ShoppingCart className="w-3 h-3" /> Add to Cart</>}
          </button>
        </div>

        {/* Hover accent line */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-[#fcd020]"
          initial={{ width: "0%" }}
          animate={{ width: isHovered ? "100%" : "0%" }}
          transition={{ duration: 0.3 }}
        />
      </motion.article>
    </Link>
  )
}
