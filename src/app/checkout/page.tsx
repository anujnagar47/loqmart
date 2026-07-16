"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Lock, CreditCard, Package, Loader2, MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useCartStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
// createClient is still used for auth.getSession

const STEPS = ["Address", "Payment", "Review"] as const

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal } = useCartStore()
  const [step, setStep] = useState(1)

  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay")
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const [promoInput,    setPromoInput]    = useState("")
  const [promoData,     setPromoData]     = useState<{ code: string; description: string; discount_percent: number; free_delivery: boolean; free_order: boolean } | null>(null)
  const [promoError,    setPromoError]    = useState("")
  const [applyingPromo, setApplyingPromo] = useState(false)

  const [newAddress, setNewAddress] = useState({
    name: "", phone: "", address_line1: "", city: "", state: "", state_code: "", pincode: "",
  })

  useEffect(() => {
    // Load Razorpay SDK
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script")
      script.id = "razorpay-script"
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      document.body.appendChild(script)
    }

    async function fetchCheckoutData() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push("/auth"); return }
      setUser(session.user)
      // Use API route (service client) to bypass RLS
      const res = await fetch("/api/user/addresses")
      if (res.ok) {
        const d = await res.json()
        const addrs = d.addresses || []
        if (addrs.length > 0) {
          setAddresses(addrs)
          const def = addrs.find((a: any) => a.is_default)
          setSelectedAddress(def ? def.id : addrs[0].id)
        }
      }
      setIsLoading(false)
    }
    fetchCheckoutData()
  }, [router])

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    setApplyingPromo(true)
    setPromoError("")
    setPromoData(null)
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setPromoError(data.error || "Invalid promo code."); return }
      setPromoData(data)
    } catch {
      setPromoError("Could not validate code. Please try again.")
    } finally {
      setApplyingPromo(false)
    }
  }

  const subtotal    = getTotal()
  const discount    = promoData?.free_order
    ? subtotal
    : promoData?.discount_percent
      ? Math.round(subtotal * (promoData.discount_percent / 100))
      : 0
  const afterDiscount = subtotal - discount
  const shipping    = (promoData?.free_delivery || promoData?.free_order || afterDiscount > 999) ? 0 : 49
  const tax         = Math.round(afterDiscount * 0.02)
  const coinsEarned = Math.floor(afterDiscount / 100)
  const total       = afterDiscount + shipping + tax

  const handleContinue = () => {
    if (step === 1 && !selectedAddress) { alert("Please select or add a delivery address."); return }
    if (step < 3) setStep(step + 1)
  }

  const handleSaveAddress = async () => {
    if (!newAddress.name || !newAddress.address_line1 || !newAddress.phone || !newAddress.pincode) {
      alert("Please fill all required fields."); return
    }
    const res = await fetch("/api/user/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAddress, is_default: addresses.length === 0 }),
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error || "Failed to save address."); return }
    setAddresses([...addresses, json.address])
    setSelectedAddress(json.address.id)
    setShowNewAddress(false)
  }

  const redeemPromo = async (orderId: string) => {
    if (!promoData) return
    try {
      await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoData.code, order_id: orderId }),
      })
    } catch { /* non-critical */ }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { alert("Please select a delivery address."); return }
    setIsProcessing(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          address_id: selectedAddress,
          payment_method: paymentMethod,
          promo_code: promoData?.code || null,
          discount_amount: discount,
        }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || "Failed to place order."); setIsProcessing(false); return }
      if (paymentMethod === "razorpay" && typeof window !== "undefined") {
        const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        if (rzpKey && (window as any).Razorpay) {
          const rzp = new (window as any).Razorpay({
            key: rzpKey, amount: data.total * 100, currency: "INR",
            name: "LoqMart", description: `Order #${data.order_number}`,
            order_id: data.razorpay_order_id,
            handler: async () => {
              await redeemPromo(data.order_id)
              useCartStore.getState().clearCart()
              router.push(`/checkout/success?order=${data.order_id}`)
            },
            modal: { ondismiss: () => setIsProcessing(false) },
          })
          rzp.open(); return
        }
      }
      await redeemPromo(data.order_id)
      useCartStore.getState().clearCart()
      router.push(`/checkout/success?order=${data.order_id}`)
    } catch {
      alert("Something went wrong. Please try again.")
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#eeece8" }}>
        <div className="text-center">
          <Package size={28} className="text-[#1a1c1c]/20 mx-auto mb-4" />
          <h1 className="text-[20px] font-black text-[#1a1c1c] mb-2">Your cart is empty</h1>
          <p className="text-[13px] text-[#1a1c1c]/40 mb-5">Add items to proceed with checkout</p>
          <Link href="/category"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black text-[#1a1c1c]"
            style={{ background: "#fcd020" }}>
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#eeece8" }}>
        <Loader2 className="w-7 h-7 animate-spin text-[#1a1c1c]/30" />
      </div>
    )
  }

  const selectedAddrObj = addresses.find(a => a.id === selectedAddress)

  return (
    <div className="min-h-screen" style={{ background: "#eeece8" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-[24px] font-black text-[#1a1c1c] tracking-tight mb-6">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => {
            const stepNum = i + 1
            const done = step > stepNum
            const active = step === stepNum
            return (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black transition-colors"
                    style={{
                      background: done ? "#22c55e" : active ? "#fcd020" : "rgba(26,28,28,0.08)",
                      color: done ? "white" : active ? "#1a1c1c" : "rgba(26,28,28,0.35)",
                    }}>
                    {done ? <Check size={13} /> : stepNum}
                  </div>
                  <span className="text-[12px] font-semibold hidden sm:block"
                    style={{ color: active ? "#1a1c1c" : done ? "#1a1c1c" : "rgba(26,28,28,0.35)" }}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div className="w-12 sm:w-20 h-px mx-2"
                    style={{ background: step > stepNum ? "#22c55e" : "rgba(26,28,28,0.12)" }} />
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          {/* Left panel */}
          <motion.div className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(26,28,28,0.07)", boxShadow: "0 1px 4px rgba(26,28,28,0.04)" }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

            {/* Step 1: Address */}
            {step === 1 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[15px] font-black text-[#1a1c1c]">Delivery Address</h2>
                  <button onClick={() => setShowNewAddress(!showNewAddress)}
                    className="text-[12px] font-black px-3 py-1.5 rounded-lg transition-colors"
                    style={showNewAddress
                      ? { background: "rgba(26,28,28,0.08)", color: "#1a1c1c" }
                      : { background: "rgba(252,208,32,0.15)", color: "#725c00" }}>
                    {showNewAddress ? "Cancel" : "+ Add New"}
                  </button>
                </div>

                {showNewAddress && (
                  <div className="mb-5 rounded-xl p-5" style={{ background: "#eeece8" }}>
                    <h3 className="text-[13px] font-black text-[#1a1c1c] mb-4">New Address</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "name", placeholder: "Full Name", span: false },
                        { key: "phone", placeholder: "Phone Number", span: false },
                        { key: "address_line1", placeholder: "Address Line 1", span: true },
                        { key: "city", placeholder: "City", span: false },
                        { key: "state", placeholder: "State", span: false },
                        { key: "pincode", placeholder: "Pincode", span: false },
                      ].map(({ key, placeholder, span }) => (
                        <input key={key} type="text" placeholder={placeholder}
                          value={(newAddress as any)[key]}
                          onChange={e => setNewAddress(a => ({ ...a, [key]: e.target.value }))}
                          className={`h-10 px-3 rounded-xl text-[13px] outline-none ${span ? "col-span-2" : ""}`}
                          style={{ border: "1px solid rgba(26,28,28,0.14)", background: "white", color: "#1a1c1c" }}
                          onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#fcd020"}
                          onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,28,28,0.14)"}
                        />
                      ))}
                    </div>
                    <button onClick={handleSaveAddress}
                      className="mt-4 px-5 py-2 rounded-xl text-[13px] font-black text-[#1a1c1c]"
                      style={{ background: "#fcd020" }}>
                      Save Address
                    </button>
                  </div>
                )}

                {addresses.length === 0 && !showNewAddress && (
                  <div className="py-10 text-center text-[13px] text-[#1a1c1c]/40 rounded-xl"
                    style={{ border: "2px dashed rgba(26,28,28,0.12)" }}>
                    No saved addresses. Add a new address to continue.
                  </div>
                )}

                <div className="space-y-3">
                  {addresses.map(addr => (
                    <div key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                      className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: `2px solid ${selectedAddress === addr.id ? "#fcd020" : "rgba(26,28,28,0.08)"}`,
                        background: selectedAddress === addr.id ? "rgba(252,208,32,0.04)" : "white",
                      }}>
                      <div className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{ borderColor: selectedAddress === addr.id ? "#fcd020" : "rgba(26,28,28,0.2)" }}>
                        {selectedAddress === addr.id && (
                          <div className="w-2 h-2 rounded-full" style={{ background: "#fcd020" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-[#1a1c1c]">{addr.name}</span>
                          {addr.is_default && (
                            <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-[#1a1c1c]"
                              style={{ background: "#fcd020" }}>Default</span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#1a1c1c]/50 mt-0.5">{addr.address_line1}</p>
                        <p className="text-[12px] text-[#1a1c1c]/50">{addr.city}, {addr.state_code || addr.state} — {addr.pincode}</p>
                        <p className="text-[11px] text-[#1a1c1c]/35 mt-0.5">{addr.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div>
                <h2 className="text-[15px] font-black text-[#1a1c1c] mb-5">Payment Method</h2>
                <div className="space-y-3">
                  {[
                    {
                      id: "razorpay" as const,
                      icon: <CreditCard size={20} className="text-[#1a1c1c]/40" />,
                      title: "Card / UPI / Net Banking",
                      subtitle: "Pay securely via Razorpay",
                      chips: ["Visa", "Mastercard", "UPI"],
                    },
                    {
                      id: "cod" as const,
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a1c1c]/40"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
                      title: "Cash on Delivery",
                      subtitle: "Pay when your order arrives",
                      chips: [],
                    },
                  ].map(opt => (
                    <div key={opt.id} onClick={() => setPaymentMethod(opt.id)}
                      className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: `2px solid ${paymentMethod === opt.id ? "#fcd020" : "rgba(26,28,28,0.08)"}`,
                        background: paymentMethod === opt.id ? "rgba(252,208,32,0.04)" : "white",
                      }}>
                      <div className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: paymentMethod === opt.id ? "#fcd020" : "rgba(26,28,28,0.2)" }}>
                        {paymentMethod === opt.id && <div className="w-2 h-2 rounded-full" style={{ background: "#fcd020" }} />}
                      </div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#eeece8" }}>
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#1a1c1c]">{opt.title}</p>
                        <p className="text-[11px] text-[#1a1c1c]/40">{opt.subtitle}</p>
                      </div>
                      {opt.chips.length > 0 && (
                        <div className="hidden sm:flex gap-1">
                          {opt.chips.map(c => (
                            <span key={c} className="text-[9.5px] font-black px-2 py-0.5 rounded-md text-[#1a1c1c]/50"
                              style={{ border: "1px solid rgba(26,28,28,0.12)" }}>{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 rounded-xl flex items-start gap-3"
                  style={{ background: "rgba(252,208,32,0.1)", border: "1px solid rgba(252,208,32,0.3)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-[13px]"
                    style={{ background: "#fcd020", color: "#725c00" }}>L</div>
                  <div>
                    <p className="text-[13px] font-bold text-[#725c00]">Earn {coinsEarned} LoqCoins on this order</p>
                    <p className="text-[11px] text-[#725c00]/60">Credited after delivery confirmation</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div>
                <h2 className="text-[15px] font-black text-[#1a1c1c] mb-5">Review Order</h2>

                <div className="space-y-3 mb-5">
                  {/* Address summary */}
                  <div className="p-4 rounded-xl" style={{ background: "#eeece8" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={12} className="text-[#1a1c1c]/40" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#1a1c1c]/45">Delivery Address</span>
                    </div>
                    {selectedAddrObj ? (
                      <div className="text-[13px] text-[#1a1c1c]/70 leading-relaxed">
                        <span className="font-bold text-[#1a1c1c]">{selectedAddrObj.name}</span><br />
                        {selectedAddrObj.address_line1}<br />
                        {selectedAddrObj.city}, {selectedAddrObj.state_code || selectedAddrObj.state} — {selectedAddrObj.pincode}<br />
                        {selectedAddrObj.phone}
                      </div>
                    ) : (
                      <p className="text-[12px] text-red-500">No address selected.</p>
                    )}
                  </div>

                  {/* Payment summary */}
                  <div className="p-4 rounded-xl" style={{ background: "#eeece8" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={12} className="text-[#1a1c1c]/40" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#1a1c1c]/45">Payment</span>
                    </div>
                    <p className="text-[13px] font-semibold text-[#1a1c1c]">
                      {paymentMethod === "razorpay" ? "Card / UPI / Net Banking" : "Cash on Delivery"}
                    </p>
                  </div>

                  {/* Items summary */}
                  <div className="p-4 rounded-xl" style={{ background: "#eeece8" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Package size={12} className="text-[#1a1c1c]/40" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#1a1c1c]/45">
                        Items ({items.length})
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {items.map(item => (
                        <div key={item.product_id} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: "rgba(26,28,28,0.06)" }}>
                            {item.product?.images?.[0] && (
                              <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <p className="flex-1 text-[12px] font-medium text-[#1a1c1c] line-clamp-1">{item.product?.name}</p>
                          <span className="text-[11px] text-[#1a1c1c]/40 shrink-0">×{item.quantity}</span>
                          <p className="text-[13px] font-bold text-[#1a1c1c] shrink-0">
                            {formatCurrency((item.product?.price || 0) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6 pt-5" style={{ borderTop: "1px solid rgba(26,28,28,0.07)" }}>
              {step > 1 && (
                <button onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-[#1a1c1c]/60 transition-colors"
                  style={{ border: "1px solid rgba(26,28,28,0.12)" }}>
                  Back
                </button>
              )}
              <button onClick={step < 3 ? handleContinue : handlePlaceOrder}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-black text-[#1a1c1c] disabled:opacity-50 transition-all"
                style={{ background: "#fcd020" }}
                onMouseEnter={e => { if (!isProcessing) (e.currentTarget as HTMLElement).style.filter = "brightness(0.95)" }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = ""}>
                {isProcessing && <Loader2 size={14} className="animate-spin" />}
                {step < 3
                  ? "Continue"
                  : isProcessing
                    ? "Processing"
                    : "Place Order"}
                {!isProcessing && step === 3 && <Lock size={13} />}
              </button>
            </div>
          </motion.div>

          {/* Right: order summary */}
          <div>
            <div className="bg-white rounded-2xl p-5 sticky top-24"
              style={{ border: "1px solid rgba(26,28,28,0.07)", boxShadow: "0 2px 8px rgba(26,28,28,0.04)" }}>
              <h2 className="text-[13px] font-black text-[#1a1c1c] mb-4">Order Summary</h2>

              <div className="max-h-44 overflow-y-auto space-y-2.5 mb-4 pr-1" style={{ scrollbarWidth: "none" }}>
                {items.map(item => (
                  <div key={item.product_id} className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: "#eeece8" }}>
                      {item.product?.images?.[0] && (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#1a1c1c] line-clamp-1">{item.product?.name}</p>
                      <p className="text-[10px] text-[#1a1c1c]/35">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-[12px] font-bold text-[#1a1c1c] shrink-0">
                      {formatCurrency((item.product?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div className="pt-4 mt-1" style={{ borderTop: "1px solid rgba(26,28,28,0.07)" }}>
                {promoData ? (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.18)" }}>
                    <div>
                      <p className="text-[10.5px] font-black text-green-700">{promoData.code}</p>
                      <p className="text-[10px] text-green-600/70 mt-0.5">{promoData.description}</p>
                    </div>
                    <button onClick={() => { setPromoData(null); setPromoInput(""); setPromoError("") }}
                      className="text-[10px] font-black text-red-500 hover:text-red-700 transition-colors px-2">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError("") }}
                        onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
                        placeholder="Promo code"
                        className="flex-1 h-9 px-3 rounded-xl text-[12px] font-semibold tracking-wider outline-none"
                        style={{ border: "1px solid rgba(26,28,28,0.14)", background: "#eeece8", color: "#1a1c1c" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "#fcd020")}
                        onBlur={e => (e.currentTarget.style.borderColor = "rgba(26,28,28,0.14)")}
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={applyingPromo || !promoInput.trim()}
                        className="px-3 h-9 rounded-xl text-[11px] font-black disabled:opacity-40 transition-colors"
                        style={{ background: "#fcd020", color: "#1a1c1c" }}>
                        {applyingPromo ? "..." : "Apply"}
                      </button>
                    </div>
                    {promoError && (
                      <p className="mt-1.5 text-[10.5px] font-semibold" style={{ color: "#b91c1c" }}>{promoError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4" style={{ borderTop: "1px solid rgba(26,28,28,0.07)" }}>
                {[
                  { label: "Subtotal", value: formatCurrency(subtotal) },
                  ...(discount > 0 ? [{ label: promoData?.free_order ? "Free order discount" : `Discount (${promoData?.discount_percent}%)`, value: <span className="text-green-600 font-black">−{formatCurrency(discount)}</span> }] : []),
                  { label: "Shipping", value: shipping === 0 ? <span className="text-green-600 font-black">FREE</span> : formatCurrency(shipping) },
                  { label: "GST (2%)", value: formatCurrency(tax) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-[12px]">
                    <span className="text-[#1a1c1c]/45">{row.label}</span>
                    <span className="font-semibold text-[#1a1c1c]">{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#1a1c1c]/45">LoqCoins to earn</span>
                  <span className="font-bold text-[#725c00]">+{coinsEarned}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 mt-2"
                style={{ borderTop: "1px solid rgba(26,28,28,0.07)" }}>
                <span className="text-[14px] font-black text-[#1a1c1c]">Total</span>
                <div className="text-right">
                  {discount > 0 && (
                    <p className="text-[11px] line-through text-[#1a1c1c]/35">{formatCurrency(subtotal + (subtotal > 999 ? 0 : 49) + Math.round(subtotal * 0.02))}</p>
                  )}
                  <span className="text-[20px] font-black text-[#1a1c1c]">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
