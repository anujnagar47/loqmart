"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, Package, MapPin, ArrowRight, Loader2 } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"

interface OrderItem {
  id: string
  quantity: number
  total: number
  product: { name: string; images: string[] } | null
}
interface Order {
  id: string
  order_number: string
  total: number
  subtotal: number
  discount_amount: number
  payment_status: string
  order_status: string
  order_items: OrderItem[]
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FBF9F5" }}>
        <Loader2 className="w-7 h-7 animate-spin text-[#111827]/30" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order")
  const { clearCart } = useCartStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(!!orderId)

  useEffect(() => {
    const timer = setTimeout(() => clearCart(), 1000)
    return () => clearTimeout(timer)
  }, [clearCart])

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/user/orders?id=${orderId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setOrder(data?.order || null))
      .finally(() => setLoading(false))
  }, [orderId])

  const coinsEarned = order ? Math.max(0, Math.floor((order.subtotal - (order.discount_amount || 0)) / 100)) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FBF9F5" }}>
        <Loader2 className="w-7 h-7 animate-spin text-[#111827]/30" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#FBF9F5" }}>
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
          <h1 className="text-[32px] font-extrabold text-[#111827] tracking-tight mb-2">Order Placed!</h1>
          <p className="text-[14px] text-[#111827]/50">
            {order ? (
              <>
                Your order <span className="font-bold text-[#111827]">#{order.order_number}</span>{" "}
                {order.payment_status === "paid" || order.order_status === "confirmed"
                  ? "is confirmed."
                  : order.payment_status === "failed"
                    ? "has a failed payment. Please check your account for next steps."
                    : "has been received. Track its status from your account."}
              </>
            ) : "Your order details could not be loaded. Check your account for the latest status."}
          </p>
        </motion.div>

        {/* LoqCoins earned */}
        {order?.payment_status === "paid" && coinsEarned > 0 && (
          <motion.div className="rounded-2xl p-5 flex items-center gap-4 mb-5"
            style={{ background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.35)" }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <motion.div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-[18px] font-black"
              style={{ background: "#FACC15", color: "#111827" }}
              initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.5 }}>
              L
            </motion.div>
            <div>
              <p className="text-[16px] font-black text-[#111827]">+{coinsEarned} LoqCoins Earned!</p>
              <p className="text-[12px] text-[#111827]/60 mt-0.5">Credited now. Redeem on future purchases.</p>
            </div>
          </motion.div>
        )}

        {/* Order summary */}
        {order && order.order_items.length > 0 && (
          <motion.div className="bg-white rounded-2xl p-5 mb-5"
            style={{ border: "1px solid rgba(17,24,39,0.07)" }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-[13px] font-black text-[#111827] mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {order.order_items.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0" style={{ background: "#FBF9F5" }}>
                    {item.product?.images?.[0] && (
                      <img src={item.product.images[0]} alt={item.product?.name || ""} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#111827] line-clamp-1">{item.product?.name}</p>
                    <p className="text-[11px] text-[#111827]/35">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-[13px] font-bold text-[#111827]">{formatCurrency(item.total)}</p>
                </div>
              ))}
              {order.order_items.length > 3 && (
                <p className="text-[12px] text-[#111827]/40">+{order.order_items.length - 3} more items</p>
              )}
            </div>
            <div className="flex justify-between items-center pt-4"
              style={{ borderTop: "1px solid rgba(17,24,39,0.07)" }}>
              <span className="text-[14px] font-black text-[#111827]">
                {order.payment_status === "paid" ? "Total Paid" : "Order Total"}
              </span>
              <span className="text-[20px] font-black text-[#111827]">{formatCurrency(order.total)}</span>
            </div>
          </motion.div>
        )}

        {/* What's next */}
        <motion.div className="bg-white rounded-2xl p-5 mb-6"
          style={{ border: "1px solid rgba(17,24,39,0.07)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-[13px] font-black text-[#111827] mb-4">What happens next?</h2>
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
                  style={{ background: s.done ? "rgba(5,150,105,0.1)" : "rgba(17,24,39,0.06)" }}>
                  <s.icon className="w-4 h-4" style={{ color: s.done ? "#059669" : "rgba(17,24,39,0.35)" }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: s.done ? "#111827" : "rgba(17,24,39,0.45)" }}>
                    {s.label}
                  </p>
                  <p className="text-[11px] text-[#111827]/35">{s.desc}</p>
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
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-black text-[#111827]"
              style={{ background: "#FACC15" }}>
              Track Order <ArrowRight size={14} />
            </Link>
          </motion.div>
          <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Link href="/category"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-semibold text-[#111827] transition-colors"
              style={{ border: "1px solid rgba(17,24,39,0.14)", background: "white" }}>
              Continue Shopping
            </Link>
          </motion.div>
        </motion.div>

        <p className="text-center text-[11px] text-[#111827]/35 mt-5">
          <Link href="/account" className="text-[#111827] font-semibold hover:underline">
            View all orders
          </Link>
        </p>
      </div>
    </div>
  )
}
