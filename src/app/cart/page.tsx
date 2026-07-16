"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus, Trash2, ArrowLeft, ArrowRight, Package, ShieldCheck, Truck } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useCartStore } from "@/lib/store"

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore()

  const subtotal = getTotal()
  const shipping = subtotal > 999 ? 0 : 49
  const tax      = Math.round(subtotal * 0.02)
  const total    = subtotal + shipping + tax
  const coinsToEarn = Math.floor(subtotal / 100)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#eeece8] flex items-center justify-center px-4">
        <motion.div className="text-center max-w-sm"
          initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
          <div className="w-20 h-20 rounded-2xl bg-white/70 flex items-center justify-center mx-auto mb-5"
            style={{ border: "1px solid rgba(26,28,28,0.07)" }}>
            <Package size={28} className="text-[#1a1c1c]/25" />
          </div>
          <h1 className="text-[22px] font-black text-[#1a1c1c] tracking-tight mb-2">Cart is empty</h1>
          <p className="text-[13px] text-[#1a1c1c]/45 mb-6 leading-relaxed">
            You have not added anything yet. Explore our collection of authentic Indian crafts.
          </p>
          <Link href="/category"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-black text-[#1a1c1c] transition-colors"
            style={{ background: "#fcd020" }}>
            Browse Products <ArrowRight size={13} />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "#eeece8" }}>
      {/* Sticky mobile checkout bar */}
      <div className="fixed bottom-14 left-0 right-0 z-40 lg:hidden px-4 py-2"
        style={{ background: "rgba(238,236,232,0.97)", borderTop: "1px solid rgba(26,28,28,0.08)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] text-[#1a1c1c]/40">Order total</p>
            <p className="text-[17px] font-black text-[#1a1c1c]">{formatCurrency(total)}</p>
          </div>
          <Link href="/checkout"
            className="flex items-center justify-center gap-1.5 h-11 px-6 rounded-xl text-[13px] font-black text-[#1a1c1c]"
            style={{ background: "#fcd020" }}>
            Checkout →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div>
            <h1 className="text-[24px] font-black text-[#1a1c1c] tracking-tight leading-none">Cart</h1>
            <p className="text-[12px] text-[#1a1c1c]/40 mt-1">{items.length} {items.length === 1 ? "item" : "items"}</p>
          </div>
          <Link href="/category"
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1a1c1c]/45 hover:text-[#1a1c1c] transition-colors">
            <ArrowLeft size={13} /> Continue shopping
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          {/* Cart items */}
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.div key={item.product_id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -60, scale: 0.95, transition: { duration: 0.22, ease: "easeIn" } }}
                  transition={{ type: "spring", stiffness: 300, damping: 28, delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-4 flex gap-4"
                  style={{ border: "1px solid rgba(26,28,28,0.06)", boxShadow: "0 1px 4px rgba(26,28,28,0.04)" }}>
                  {/* Image */}
                  <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 bg-[#eeece8]">
                    {item.product?.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-[#1a1c1c]/20" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {item.product?.mode && (
                          <span className="inline-block text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5"
                            style={item.product.mode === "handmade"
                              ? { background: "rgba(5,150,105,0.09)", color: "#065f46" }
                              : { background: "rgba(37,99,235,0.09)", color: "#1d4ed8" }}>
                            {item.product.mode === "handmade" ? "Handmade" : "Machine Made"}
                          </span>
                        )}
                        <h3 className="font-bold text-[#1a1c1c] text-[14px] leading-snug truncate pr-2">
                          {item.product?.name}
                        </h3>
                        {item.product?.state_code && (
                          <p className="text-[11px] text-[#1a1c1c]/35 mt-0.5">{item.product.state_code}</p>
                        )}
                      </div>
                      <motion.button onClick={() => removeItem(item.product_id)}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        style={{ background: "rgba(220,38,38,0.06)", color: "#ef4444" }}>
                        <Trash2 size={12} />
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Qty control */}
                      <div className="flex items-center rounded-xl overflow-hidden"
                        style={{ border: "1px solid rgba(26,28,28,0.1)" }}>
                        <motion.button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          whileTap={{ scale: 0.85 }}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#1a1c1c]/5 transition-colors text-[#1a1c1c]/50">
                          <Minus size={12} />
                        </motion.button>
                        <motion.span
                          key={item.quantity}
                          initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="w-9 text-center text-[13px] font-black text-[#1a1c1c]">
                          {item.quantity}
                        </motion.span>
                        <motion.button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          whileTap={{ scale: 0.85 }}
                          disabled={item.quantity >= (item.product?.stock || 0)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#1a1c1c]/5 transition-colors text-[#1a1c1c]/50 disabled:opacity-30 disabled:cursor-not-allowed">
                          <Plus size={12} />
                        </motion.button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <motion.p key={item.quantity} className="text-[16px] font-black text-[#1a1c1c]"
                          initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                          {formatCurrency((item.product?.price || 0) * item.quantity)}
                        </motion.p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-[#1a1c1c]/35">
                            {formatCurrency(item.product?.price || 0)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear cart */}
            <div className="flex justify-end pt-1">
              <motion.button onClick={clearCart} whileHover={{ color: "#ef4444" }}
                className="text-[11px] font-semibold text-[#1a1c1c]/35 transition-colors">
                Remove all items
              </motion.button>
            </div>

            {/* Trust row */}
            <motion.div className="flex items-center gap-6 pt-2 px-1"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              {[
                { icon: ShieldCheck, text: "Secure Checkout" },
                { icon: Truck, text: "Free above ₹999" },
                { icon: Package, text: "Easy Returns" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon size={12} className="text-[#725c00]" />
                  <span className="text-[10.5px] font-semibold text-[#1a1c1c]/45">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Order summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.1 }}>
            <div className="bg-white rounded-2xl p-5 sticky top-24"
              style={{ border: "1px solid rgba(26,28,28,0.06)", boxShadow: "0 2px 8px rgba(26,28,28,0.05)" }}>
              <h2 className="text-[14px] font-black text-[#1a1c1c] tracking-tight mb-4">Order Summary</h2>

              <div className="space-y-3 text-[13px]" style={{ borderBottom: "1px solid rgba(26,28,28,0.06)", paddingBottom: "1rem" }}>
                <div className="flex justify-between">
                  <span className="text-[#1a1c1c]/50">Subtotal ({items.length} items)</span>
                  <motion.span key={subtotal} className="font-semibold text-[#1a1c1c]"
                    initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                    {formatCurrency(subtotal)}
                  </motion.span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1a1c1c]/50">Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0
                      ? <span className="text-green-600 font-black">FREE</span>
                      : <span className="text-[#1a1c1c]">{formatCurrency(shipping)}</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1a1c1c]/50">GST (2%)</span>
                  <span className="font-semibold text-[#1a1c1c]">{formatCurrency(tax)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-4">
                <span className="text-[15px] font-black text-[#1a1c1c]">Total</span>
                <motion.span key={total} className="text-[20px] font-black text-[#1a1c1c]"
                  initial={{ scale: 1.15, color: "#fcd020" }} animate={{ scale: 1, color: "#1a1c1c" }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}>
                  {formatCurrency(total)}
                </motion.span>
              </div>

              {/* LoqCoins */}
              <motion.div className="rounded-xl px-3 py-2.5 mb-4 flex items-center justify-between"
                style={{ background: "rgba(252,208,32,0.12)", border: "1px solid rgba(252,208,32,0.3)" }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <span className="text-[11px] font-bold text-[#725c00]">LoqCoins you will earn</span>
                <motion.span key={coinsToEarn} className="text-[13px] font-black text-[#725c00]"
                  initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                  +{coinsToEarn}
                </motion.span>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Link href="/checkout"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-black text-[#1a1c1c] transition-all"
                  style={{ background: "#fcd020" }}>
                  Proceed to Checkout <ArrowRight size={14} />
                </Link>
              </motion.div>

              <p className="text-[10px] text-center text-[#1a1c1c]/30 mt-3">
                Secured by Razorpay · PCI DSS Compliant
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
