"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, Package, MapPin, ArrowRight } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"

export default function CheckoutSuccessPage() {
  const { items, getTotal, clearCart } = useCartStore()
  const total = getTotal()
  const coinsEarned = Math.floor(total / 100)
  const orderNumber = `LM${Date.now().toString().slice(-6)}`

  useEffect(() => {
    const timer = setTimeout(() => clearCart(), 1000)
    return () => clearTimeout(timer)
  }, [clearCart])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#eeece8" }}>
      <div className="max-w-2xl w-full">

        {/* Hero check */}
        <motion.div className="text-center mb-10"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}>
          <motion.div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(5,150,105,0.1)" }}
            animate={{ boxShadow: ["0 0 0 0px rgba(5,150,105,0.2)", "0 0 0 16px rgba(5,150,105,0)", "0 0 0 0px rgba(5,150,105,0)"] }}
            transition={{ repeat: 2, duration: 1.2, delay: 0.4 }}>
            <CheckCircle className="w-14 h-14 text-green-600" />
          </motion.div>
          <h1 className="text-[32px] font-extrabold text-[#1a1c1c] tracking-tight mb-2">Order Placed!</h1>
          <p className="text-[14px] text-[#1a1c1c]/50">
            Your order <span className="font-bold text-[#1a1c1c]">#{orderNumber}</span> is confirmed
          </p>
        </motion.div>

        {/* LoqCoins earned */}
        {coinsEarned > 0 && (
          <motion.div className="rounded-2xl p-5 flex items-center gap-4 mb-5"
            style={{ background: "rgba(252,208,32,0.12)", border: "1px solid rgba(252,208,32,0.35)" }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <motion.div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-[18px] font-black"
              style={{ background: "#fcd020", color: "#725c00" }}
              initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.5 }}>
              L
            </motion.div>
            <div>
              <p className="text-[16px] font-black text-[#725c00]">+{coinsEarned} LoqCoins Earned!</p>
              <p className="text-[12px] text-[#725c00]/60 mt-0.5">Credited after delivery. Redeem on future purchases.</p>
            </div>
          </motion.div>
        )}

        {/* Order summary */}
        {items.length > 0 && (
          <motion.div className="bg-white rounded-2xl p-5 mb-5"
            style={{ border: "1px solid rgba(26,28,28,0.07)" }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-[13px] font-black text-[#1a1c1c] mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {items.slice(0, 3).map(item => (
                <div key={item.product_id} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0" style={{ background: "#eeece8" }}>
                    {item.product?.images?.[0] && (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1a1c1c] line-clamp-1">{item.product?.name}</p>
                    <p className="text-[11px] text-[#1a1c1c]/35">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-[13px] font-bold text-[#1a1c1c]">
                    {formatCurrency((item.product?.price || 0) * item.quantity)}
                  </p>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-[12px] text-[#1a1c1c]/40">+{items.length - 3} more items</p>
              )}
            </div>
            <div className="flex justify-between items-center pt-4"
              style={{ borderTop: "1px solid rgba(26,28,28,0.07)" }}>
              <span className="text-[14px] font-black text-[#1a1c1c]">Total Paid</span>
              <span className="text-[20px] font-black text-[#1a1c1c]">{formatCurrency(total)}</span>
            </div>
          </motion.div>
        )}

        {/* What's next */}
        <motion.div className="bg-white rounded-2xl p-5 mb-6"
          style={{ border: "1px solid rgba(26,28,28,0.07)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-[13px] font-black text-[#1a1c1c] mb-4">What happens next?</h2>
          <div className="space-y-4">
            {[
              { icon: CheckCircle, label: "Order Confirmed", desc: "Just now", done: true },
              { icon: Package, label: "Seller preparing your order", desc: "Within 24 hours", done: false },
              { icon: MapPin, label: "Out for delivery", desc: "Estimated 5–7 business days", done: false },
            ].map((s, i) => (
              <motion.div key={i} className="flex items-start gap-3"
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.08 }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: s.done ? "rgba(5,150,105,0.1)" : "rgba(26,28,28,0.06)" }}>
                  <s.icon className="w-4 h-4" style={{ color: s.done ? "#059669" : "rgba(26,28,28,0.35)" }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: s.done ? "#1a1c1c" : "rgba(26,28,28,0.45)" }}>
                    {s.label}
                  </p>
                  <p className="text-[11px] text-[#1a1c1c]/35">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Link href="/account"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-black text-[#1a1c1c]"
              style={{ background: "#fcd020" }}>
              Track Order <ArrowRight size={14} />
            </Link>
          </motion.div>
          <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Link href="/category"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-semibold text-[#1a1c1c] transition-colors"
              style={{ border: "1px solid rgba(26,28,28,0.14)", background: "white" }}>
              Continue Shopping
            </Link>
          </motion.div>
        </motion.div>

        <p className="text-center text-[11px] text-[#1a1c1c]/35 mt-5">
          Confirmation sent to your mobile.{" "}
          <Link href="/account" className="text-[#725c00] font-semibold hover:underline">
            View all orders
          </Link>
        </p>
      </div>
    </div>
  )
}
