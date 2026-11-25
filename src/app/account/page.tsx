"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  User, Package, MapPin, Wallet, Heart, Check, Truck, Clock,
  LogOut, ChevronRight, Plus, Trash2, Star, ShoppingBag,
  Loader2, Save, X, RotateCcw
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useInquiryStore } from "@/lib/store"
import { Toast, useToast } from "@/components/ui/toast"

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "orders",    label: "Orders",    icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin  },
  { id: "coins",     label: "LoqCoins",  icon: Wallet  },
  { id: "wishlist",  label: "Wishlist",  icon: Heart   },
  { id: "profile",   label: "Profile",   icon: User    },
]

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: typeof Check }> = {
  delivered:  { label: "Delivered",  bg: "rgba(5,150,105,0.08)",  text: "#065f46", border: "rgba(5,150,105,0.2)",  icon: Check  },
  shipped:    { label: "Shipped",    bg: "rgba(37,99,235,0.08)",  text: "#1e40af", border: "rgba(37,99,235,0.2)",  icon: Truck  },
  processing: { label: "Processing", bg: "rgba(217,119,6,0.08)",  text: "#92400e", border: "rgba(217,119,6,0.2)",  icon: Clock  },
  confirmed:  { label: "Confirmed",  bg: "rgba(37,99,235,0.08)",  text: "#1e40af", border: "rgba(37,99,235,0.2)",  icon: Check  },
  pending:    { label: "Pending",    bg: "rgba(217,119,6,0.08)",  text: "#92400e", border: "rgba(217,119,6,0.2)",  icon: Clock  },
  cancelled:  { label: "Cancelled",  bg: "rgba(220,38,38,0.08)",  text: "#b91c1c", border: "rgba(220,38,38,0.2)",  icon: X      },
}

const VALID_TABS = ["orders", "addresses", "coins", "wishlist", "profile"] as const
type TabId = typeof VALID_TABS[number]

// Mirrors the real `order_status` enum (pending/confirmed/processing/shipped/
// delivered/cancelled) — "processing" has no timestamp column in the schema,
// so it only ever shows a checkmark, never a fabricated date.
const ORDER_STEPS: { key: string; label: string }[] = [
  { key: "pending",    label: "Placed"     },
  { key: "confirmed",  label: "Confirmed"  },
  { key: "processing", label: "Processing" },
  { key: "shipped",    label: "Shipped"    },
  { key: "delivered",  label: "Delivered"  },
]

function AccountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const addInquiry = useInquiryStore(s => s.addItem)
  const { toastProps, showError } = useToast()
  const tabParam = searchParams.get("tab") as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && (VALID_TABS as readonly string[]).includes(tabParam) ? tabParam : "orders"
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")

  const [user, setUser]           = useState<any>(null)
  const [profile, setProfile]     = useState<any>(null)
  const [orders, setOrders]       = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [returnFormItemId, setReturnFormItemId] = useState<string | null>(null)
  const [returnReason, setReturnReason] = useState("damaged")
  const [returnDescription, setReturnDescription] = useState("")
  const [returnSubmitting, setReturnSubmitting] = useState(false)
  const [returnError, setReturnError] = useState("")
  const [returnedItemIds, setReturnedItemIds] = useState<string[]>([])
  const [cancelConfirming, setCancelConfirming] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const [addresses, setAddresses] = useState<any[]>([])
  const [coinBalance, setCoinBalance] = useState<any>(null)
  const [coinLedger, setCoinLedger]   = useState<any[]>([])
  const [wishlist, setWishlist]   = useState<any[]>([])

  const [fullName, setFullName] = useState("")
  const [phone, setPhone]       = useState("")

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddr, setNewAddr] = useState({
    name: "", phone: "", address_line1: "", address_line2: "",
    city: "", state: "", state_code: "", pincode: "", is_default: false,
  })

  useEffect(() => { loadAccountData() }, [])

  async function loadAccountData() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push("/login"); return }
    const { data: publicProfile } = await supabase.from("users").select("role").eq("id", session.user.id).maybeSingle()
    if (!publicProfile || !["buyer", "seller", "admin", "sub_admin"].includes(publicProfile.role)) { router.replace("/priority-invite"); return }
    setUser(session.user)

    const [profileRes, ordersRes, addressRes, coinsRes, ledgerRes, wishlistRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", session.user.id).single(),
      fetch("/api/user/orders").then(r => r.json()),
      fetch("/api/user/addresses").then(r => r.json()),
      supabase.from("loqcoin_balances").select("*").eq("user_id", session.user.id).single(),
      supabase.from("loqcoin_ledger")
        .select("id, transaction_type, amount, balance_after, source, description, created_at")
        .eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("wishlists")
        .select("*, product:products(id, name, price, mrp, images, rating)")
        .eq("user_id", session.user.id),
    ])

    if (profileRes.data) {
      setProfile(profileRes.data)
      setFullName(profileRes.data.full_name || "")
      setPhone(profileRes.data.phone || "")
    } else {
      const meta = session.user.user_metadata || {}
      setProfile({ full_name: meta.full_name || session.user.email?.split("@")[0] || "LoqMart User", phone: "" })
      setFullName(meta.full_name || "")
    }

    if (ordersRes.orders)   setOrders(ordersRes.orders)
    if (addressRes.addresses) setAddresses(addressRes.addresses)
    if (coinsRes.data)    setCoinBalance(coinsRes.data)
    if (ledgerRes.data)   setCoinLedger(ledgerRes.data)
    if (wishlistRes.data) setWishlist(wishlistRes.data)
    setIsLoading(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  async function handleSaveProfile() {
    if (!user) return
    setIsSaving(true); setSaveMsg("")
    const supabase = createClient()
    const { error } = await supabase.from("users")
      .update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq("id", user.id)
    setIsSaving(false)
    if (error) { setSaveMsg("Failed to save. Please try again.") }
    else {
      setProfile((p: any) => ({ ...p, full_name: fullName, phone }))
      setSaveMsg("Profile updated successfully.")
      setTimeout(() => setSaveMsg(""), 3000)
    }
  }

  async function handleAddAddress() {
    if (!user) return
    if (!newAddr.name.trim()) { showError("Full name is required."); return }
    if (!/^\d{10}$/.test(newAddr.phone.replace(/\D/g, ""))) { showError("Enter a valid 10-digit phone number."); return }
    if (!newAddr.address_line1.trim()) { showError("Address line 1 is required."); return }
    if (!newAddr.city.trim()) { showError("City is required."); return }
    if (!newAddr.state.trim()) { showError("State is required."); return }
    if (!/^\d{6}$/.test(newAddr.pincode)) { showError("Enter a valid 6-digit pincode."); return }
    const res = await fetch("/api/user/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAddr),
    })
    const json = await res.json()
    if (res.ok && json.address) {
      setAddresses([...addresses, json.address])
      setShowAddressForm(false)
      setNewAddr({ name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", state_code: "", pincode: "", is_default: false })
    } else { showError(json.error || "Failed to save address. Please try again.") }
  }

  async function handleDeleteAddress(id: string) {
    await fetch(`/api/user/addresses?id=${id}`, { method: "DELETE" })
    setAddresses(addresses.filter(a => a.id !== id))
  }

  async function handleRemoveWishlist(productId: string) {
    const supabase = createClient()
    await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId)
    setWishlist(wishlist.filter(w => w.product?.id !== productId))
  }

  async function handleCancelOrder(orderId: string) {
    setCancelSubmitting(true)
    setCancelError("")
    try {
      const res = await fetch(`/api/user/orders/${orderId}/cancel`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setCancelError(data.error || "Failed to cancel order.")
        return
      }
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: "cancelled" } : o))
      setSelectedOrder((prev: any) => prev ? { ...prev, order_status: "cancelled" } : prev)
      setCancelConfirming(false)
    } catch {
      setCancelError("Failed to cancel order. Please try again.")
    } finally {
      setCancelSubmitting(false)
    }
  }

  async function handleRequestReturn(orderId: string, orderItemId: string) {
    if (!returnDescription.trim() || returnDescription.trim().length < 10) {
      setReturnError("Please describe the issue in more detail (at least 10 characters).")
      return
    }
    setReturnSubmitting(true)
    setReturnError("")
    try {
      const res = await fetch("/api/user/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, order_item_id: orderItemId, reason: returnReason, description: returnDescription }),
      })
      const data = await res.json()
      if (!res.ok) {
        setReturnError(data.error || "Failed to submit return request.")
        return
      }
      setReturnedItemIds(ids => [...ids, orderItemId])
      setReturnFormItemId(null)
      setReturnDescription("")
      setReturnReason("damaged")
    } catch {
      setReturnError("Failed to submit return request. Please try again.")
    } finally {
      setReturnSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FBF9F5" }}>
        <motion.div className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="w-7 h-7 animate-spin text-[#111827]/30" />
          <p className="text-[12px] font-semibold text-[#111827]/40">Loading your account</p>
        </motion.div>
      </div>
    )
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "LoqMart User"
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen" style={{ background: "#FBF9F5" }}>
      {toastProps && <Toast {...toastProps} />}
      {/* Yellow header */}
      <div style={{ background: "#FACC15" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-0">
          <div className="flex items-center justify-between gap-6 pb-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <motion.div className="relative shrink-0"
                initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.05 }}>
                <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center"
                  style={{ background: "#111827", border: "3px solid rgba(17,24,39,0.2)" }}>
                  <span className="text-xl font-black" style={{ color: "#FACC15" }}>{initials}</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2"
                  style={{ background: "#22c55e", borderColor: "#FACC15" }} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12, duration: 0.3 }}>
                <h1 className="text-[22px] font-black text-[#111827] tracking-tight leading-none">{displayName}</h1>
                <p className="text-[12px] text-[#111827]/50 mt-1">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full"
                    style={{ background: "#111827", color: "#FACC15" }}>
                    <Wallet className="w-3 h-3" /> {coinBalance?.balance ?? 0} LoqCoins
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full"
                    style={{ background: "rgba(17,24,39,0.12)", color: "#111827" }}>
                    <Package className="w-3 h-3" /> {orders.length} order{orders.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </motion.div>
            </div>

            <motion.button onClick={handleSignOut} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-[4px] text-[12px] font-semibold transition-colors"
              style={{ background: "rgba(17,24,39,0.1)", color: "#111827" }}>
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold whitespace-nowrap transition-colors shrink-0"
                style={{ color: activeTab === tab.id ? "#111827" : "rgba(17,24,39,0.4)" }}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.span layoutId="account-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ background: "#111827" }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }} />
                )}
              </button>
            ))}
            <button onClick={handleSignOut}
              className="md:hidden flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold whitespace-nowrap transition-colors ml-auto shrink-0"
              style={{ color: "rgba(185,28,28,0.7)" }}>
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">

          {/* ORDERS */}
          {activeTab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {orders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders yet" subtitle="Your orders will appear here once you start shopping." />
              ) : (
                <div className="space-y-3">
                  {orders.map((order, i) => {
                    const status = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending
                    const StatusIcon = status.icon
                    const images = order.order_items?.flatMap((it: any) => it.product?.images?.[0]).filter(Boolean).slice(0, 3) || []
                    const itemNames = order.order_items?.map((it: any) => it.product?.name).filter(Boolean) || []
                    return (
                      <motion.div key={order.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 26 }}
                        whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(17,24,39,0.08)" }}
                        className="bg-white rounded-[4px] overflow-hidden cursor-pointer"
                        style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                        <div className="flex items-center justify-between px-5 py-2.5"
                          style={{ borderBottom: "1px solid rgba(17,24,39,0.06)", background: "rgba(238,236,232,0.5)" }}>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-[#111827] text-[12.5px] tracking-wide">
                              {order.order_number || `#${order.id.split("-")[0].toUpperCase()}`}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}>
                              <StatusIcon className="w-2.5 h-2.5" /> {status.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#111827]/35 font-medium">
                            {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 px-5 py-4">
                          {images.length > 0 && (
                            <div className="flex -space-x-2 shrink-0">
                              {images.map((img: string, idx: number) => (
                                <div key={idx} className="w-11 h-11 rounded-lg overflow-hidden bg-[#FBF9F5]"
                                  style={{ border: "2px solid white" }}>
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#111827] truncate">
                              {itemNames.slice(0, 2).join(", ")}
                              {itemNames.length > 2 && <span className="text-[#111827]/35"> +{itemNames.length - 2} more</span>}
                            </p>
                            <p className="text-[11px] text-[#111827]/35 mt-0.5">
                              {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <p className="text-[18px] font-black text-[#111827]">
                              {formatCurrency(order.total ?? order.subtotal ?? 0)}
                            </p>
                            <motion.button onClick={() => { setSelectedOrder(order); setCancelConfirming(false); setCancelError(""); setReturnFormItemId(null) }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider text-[#111827] cursor-pointer"
                              style={{ background: "#FACC15" }}>
                              Details <ChevronRight className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ADDRESSES */}
          {activeTab === "addresses" && (
            <motion.div key="addresses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {addresses.map((addr, i) => (
                    <motion.div key={addr.id}
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-[4px] p-5"
                      style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[14px] text-[#111827]">{addr.name}</span>
                            {addr.is_default && (
                              <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-[#111827]"
                                style={{ background: "#FACC15" }}>Default</span>
                            )}
                          </div>
                          <p className="text-[12px] text-[#111827]/45 mt-0.5">{addr.phone}</p>
                        </div>
                        <motion.button onClick={() => handleDeleteAddress(addr.id)}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: "rgba(220,38,38,0.06)", color: "#ef4444" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                      <p className="text-[13px] text-[#111827]/60">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-[13px] text-[#111827]/60">{addr.address_line2}</p>}
                      <p className="text-[13px] text-[#111827]/60">{addr.city}, {addr.state} – {addr.pincode}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <motion.button onClick={() => setShowAddressForm(true)}
                  whileHover={{ borderColor: "#FACC15", backgroundColor: "rgba(250,204,21,0.04)", scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-white rounded-[4px] p-5 flex flex-col items-center justify-center min-h-[150px] transition-colors"
                  style={{ border: "2px dashed rgba(17,24,39,0.15)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                    style={{ background: "rgba(250,204,21,0.25)" }}>
                    <Plus className="w-4 h-4 text-[#111827]" />
                  </div>
                  <p className="font-bold text-[13px] text-[#111827]">Add New Address</p>
                </motion.button>
              </div>

              <AnimatePresence>
                {showAddressForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.15 } }}
                    className="mt-4 bg-white rounded-[4px] p-6"
                    style={{ border: "1px solid rgba(250,204,21,0.5)", boxShadow: "0 2px 12px rgba(250,204,21,0.12)" }}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[14px] font-black text-[#111827]">New Delivery Address</h3>
                      <motion.button onClick={() => setShowAddressForm(false)} whileHover={{ rotate: 90 }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: "rgba(17,24,39,0.06)", color: "#111827" }}>
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: "name",          label: "Full Name",      type: "text", placeholder: "e.g. Arjun Kumar", span: false },
                        { key: "phone",         label: "Phone",          type: "tel",  placeholder: "10-digit mobile", span: false },
                        { key: "address_line1", label: "Address Line 1", type: "text", placeholder: "Flat, house no., street", span: true },
                        { key: "address_line2", label: "Address Line 2", type: "text", placeholder: "Area, colony (optional)", span: true },
                        { key: "city",          label: "City",           type: "text", placeholder: "e.g. Mumbai", span: false },
                        { key: "state",         label: "State",          type: "text", placeholder: "e.g. Maharashtra", span: false },
                        { key: "state_code",    label: "State Code",     type: "text", placeholder: "e.g. MH", span: false },
                        { key: "pincode",       label: "Pincode",        type: "text", placeholder: "6-digit pincode", span: false },
                      ].map(({ key, label, type, placeholder, span }) => (
                        <div key={key} className={span ? "md:col-span-2" : ""}>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-[#111827]/50 mb-1.5">{label}</label>
                          <input type={type} placeholder={placeholder}
                            value={(newAddr as any)[key]}
                            onChange={e => setNewAddr(a => ({ ...a, [key]: e.target.value }))}
                            className="w-full h-10 px-3 rounded-[4px] text-[13px] outline-none transition-colors"
                            style={{ border: "1px solid rgba(17,24,39,0.14)", background: "#FBF9F5", color: "#111827" }}
                            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#FACC15"}
                            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(17,24,39,0.14)"}
                          />
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                      <input type="checkbox" checked={newAddr.is_default}
                        onChange={e => setNewAddr(a => ({ ...a, is_default: e.target.checked }))}
                        className="w-4 h-4 accent-[#FACC15]" />
                      <span className="text-[13px] font-medium text-[#111827]">Set as default address</span>
                    </label>
                    <div className="flex gap-3 mt-5">
                      <motion.button onClick={handleAddAddress} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="px-5 py-2.5 rounded-[4px] text-[13px] font-black text-[#111827]"
                        style={{ background: "#FACC15" }}>
                        Save Address
                      </motion.button>
                      <button onClick={() => setShowAddressForm(false)}
                        className="px-5 py-2.5 rounded-[4px] text-[13px] font-semibold text-[#111827]/60 transition-colors"
                        style={{ border: "1px solid rgba(17,24,39,0.12)" }}>
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* COINS */}
          {activeTab === "coins" && (
            <motion.div key="coins" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <motion.div className="rounded-[4px] p-6 text-center" style={{ background: "#111827" }}
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 240, damping: 22 }}>
                  <motion.div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "#FACC15" }}
                    animate={{ rotate: [0, 5, -5, 0] }} transition={{ delay: 0.5, duration: 0.6, ease: "easeInOut" }}>
                    <span className="text-xl font-black text-[#111827]">L</span>
                  </motion.div>
                  <motion.p className="text-[40px] font-black text-white leading-none mb-1"
                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}>
                    {coinBalance?.balance ?? 0}
                  </motion.p>
                  <p className="text-[12px] text-white/50 mb-1">Available LoqCoins</p>
                  <p className="text-[11px] font-bold" style={{ color: "#FACC15" }}>1 LoqCoin = ₹0.25</p>
                  <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <p className="text-[11px] text-white/40">Lifetime Earned <span className="text-white font-bold">{coinBalance?.lifetime_earned ?? 0}</span></p>
                    <p className="text-[11px] text-white/40">Lifetime Redeemed <span className="text-white font-bold">{coinBalance?.lifetime_redeemed ?? 0}</span></p>
                  </div>
                </motion.div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-[4px] p-5" style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                    <h3 className="text-[13px] font-black text-[#111827] mb-4">How to Earn LoqCoins</h3>
                    <div className="space-y-2">
                      {[
                        { action: "Complete a purchase",     coins: "+1% of value", note: "Credited after delivery" },
                        { action: "Write a verified review", coins: "+25",           note: "After purchase confirmed" },
                        { action: "Refer a friend",          coins: "+100",          note: "When they make first order" },
                        { action: "First-time purchase",     coins: "+200",          note: "Welcome bonus" },
                      ].map((item, i) => (
                        <motion.div key={item.action}
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                          className="flex items-center justify-between p-3 rounded-[4px]" style={{ background: "#FBF9F5" }}>
                          <div>
                            <p className="text-[13px] font-semibold text-[#111827]">{item.action}</p>
                            <p className="text-[11px] text-[#111827]/40">{item.note}</p>
                          </div>
                          <span className="text-[11px] font-black px-2.5 py-1 rounded-full"
                            style={{ background: "#111827", color: "#FACC15" }}>{item.coins}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-[4px] p-5" style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                    <h3 className="text-[13px] font-black text-[#111827] mb-4">Transaction History</h3>
                    {coinLedger.length === 0 ? (
                      <p className="text-center text-[12px] text-[#111827]/40 py-6">No transactions yet.</p>
                    ) : (
                      <div>
                        {coinLedger.map((tx, i) => {
                          const isEarn = tx.transaction_type === "earn" || tx.transaction_type === "refund"
                          return (
                            <motion.div key={tx.id}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                              className="flex items-center justify-between py-2.5"
                              style={{ borderBottom: "1px solid rgba(17,24,39,0.05)" }}>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-[#111827] truncate">{tx.description || tx.source}</p>
                                <p className="text-[10.5px] text-[#111827]/35">
                                  {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  {" · "}Balance: {tx.balance_after}
                                </p>
                              </div>
                              <span className={`ml-4 text-[14px] font-black ${isEarn ? "text-green-600" : "text-red-500"}`}>
                                {isEarn ? "+" : "-"}{tx.amount}
                              </span>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* WISHLIST */}
          {activeTab === "wishlist" && (
            <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {wishlist.length === 0 ? (
                <EmptyState icon={Heart} title="Wishlist is empty" subtitle="Tap the heart on any product to save it here." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {wishlist.map((item, i) => {
                      const p = item.product
                      if (!p) return null
                      return (
                        <motion.div key={item.id}
                          initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                          transition={{ delay: i * 0.04, type: "spring", stiffness: 280, damping: 24 }}
                          whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(17,24,39,0.1)" }}
                          className="bg-white rounded-[4px] overflow-hidden"
                          style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                          <div className="relative aspect-square overflow-hidden" style={{ background: "#FBF9F5" }}>
                            {p.images?.[0] && (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            )}
                            <motion.button onClick={() => handleRemoveWishlist(p.id)}
                              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-red-500"
                              style={{ background: "rgba(255,255,255,0.92)" }}>
                              <Heart className="w-4 h-4 fill-current" />
                            </motion.button>
                          </div>
                          <div className="p-4">
                            <p className="font-bold text-[13px] text-[#111827] line-clamp-2 mb-2">{p.name}</p>
                            {p.rating > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                <Star className="w-3 h-3 fill-[#FACC15] text-[#FACC15]" />
                                <span className="text-[11px] text-[#111827]/50">{p.rating}</span>
                              </div>
                            )}
                            <motion.button
                              onClick={() => addInquiry(p)}
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                              className="w-full py-2 rounded-[4px] text-[12px] font-black text-[#111827]"
                              style={{ background: "#FACC15" }}>
                              Add to Inquiry
                            </motion.button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="max-w-lg">
                <div className="bg-white rounded-[4px] p-6" style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                  <h3 className="text-[14px] font-black text-[#111827] mb-5">Personal Information</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Full Name", value: fullName, setter: setFullName, type: "text", placeholder: "Your full name" },
                      { label: "Phone Number", value: phone, setter: setPhone, type: "tel", placeholder: "+91 98765 43210" },
                    ].map(({ label, value, setter, type, placeholder }) => (
                      <div key={label}>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-[#111827]/45 mb-1.5">{label}</label>
                        <input type={type} value={value} placeholder={placeholder}
                          onChange={e => setter(e.target.value)}
                          className="w-full h-11 px-4 rounded-[4px] text-[13px] outline-none transition-colors"
                          style={{ border: "1px solid rgba(17,24,39,0.14)", background: "#FBF9F5", color: "#111827" }}
                          onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#FACC15"}
                          onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(17,24,39,0.14)"}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#111827]/45 mb-1.5">Email Address</label>
                      <input type="email" disabled value={user?.email || ""}
                        className="w-full h-11 px-4 rounded-[4px] text-[13px] cursor-not-allowed"
                        style={{ border: "1px solid rgba(17,24,39,0.08)", background: "rgba(17,24,39,0.04)", color: "rgba(17,24,39,0.35)" }}
                      />
                      <p className="text-[10.5px] text-[#111827]/35 mt-1">Email cannot be changed here.</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {saveMsg && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-4 p-3 rounded-[4px] text-[12px] font-medium"
                        style={saveMsg.includes("success")
                          ? { background: "rgba(5,150,105,0.08)", color: "#065f46" }
                          : { background: "rgba(220,38,38,0.08)", color: "#b91c1c" }}>
                        {saveMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 mt-5">
                    <motion.button onClick={handleSaveProfile} disabled={isSaving}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-[4px] text-[13px] font-black text-[#111827] disabled:opacity-50"
                      style={{ background: "#FACC15" }}>
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {isSaving ? "Saving" : "Save Changes"}
                    </motion.button>
                    <motion.button onClick={handleSignOut} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-[4px] text-[13px] font-semibold transition-colors"
                      style={{ border: "1px solid rgba(185,28,28,0.2)", color: "#b91c1c" }}>
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </motion.button>
                  </div>
                </div>

                <div className="mt-4 bg-white rounded-[4px] p-5" style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                  <h3 className="text-[13px] font-black text-[#111827] mb-3">Account Status</h3>
                  <div className="flex items-center gap-2.5">
                    <motion.span className="w-2 h-2 rounded-full"
                      style={{ background: profile?.email_verified ? "#22c55e" : "#f59e0b" }}
                      animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} />
                    <p className="text-[12px] text-[#111827]/60">
                      {profile?.email_verified ? "Email verified" : "Email not yet verified — check your inbox"}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#111827]/35 mt-2">
                    Member since {new Date(profile?.created_at || user?.created_at || Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[4px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col ag-slide-up"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(17,24,39,0.06)", background: "rgba(238,236,232,0.3)" }}>
                <div>
                  <h3 className="text-[15px] font-black text-[#111827]">Order Details</h3>
                  <p className="text-[11px] text-[#111827]/50 mt-0.5">
                    {selectedOrder.order_number || `#${selectedOrder.id.split("-")[0].toUpperCase()}`} · {new Date(selectedOrder.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-[#111827]" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 flex-1">
                {/* Status and tracking */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[4px]" style={{ background: "#ffffff" }}>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#111827]/40">Status</p>
                    <p className="text-[13px] font-bold text-[#111827] mt-0.5 capitalize">{selectedOrder.order_status}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#111827]/40">Payment Status</p>
                    <p className="text-[13px] font-bold text-[#111827] mt-0.5 capitalize">{selectedOrder.payment_status}</p>
                  </div>
                  {selectedOrder.tracking_number && (
                    <div className="col-span-2 pt-2" style={{ borderTop: "1px solid rgba(17,24,39,0.06)" }}>
                      <p className="text-[9px] font-black uppercase tracking-wider text-[#111827]/40">Tracking Number</p>
                      <p className="text-[12px] font-mono text-primary mt-0.5">{selectedOrder.tracking_number}</p>
                    </div>
                  )}

                  {["pending", "confirmed"].includes(selectedOrder.order_status) &&
                    ["pending", "failed"].includes(selectedOrder.payment_status) && (
                    <div className="col-span-2 pt-3" style={{ borderTop: "1px solid rgba(17,24,39,0.06)" }}>
                      {cancelError && <p className="text-[11px] text-red-600 mb-2">{cancelError}</p>}
                      {cancelConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#111827]/60">Cancel this order?</span>
                          <button
                            onClick={() => handleCancelOrder(selectedOrder.id)}
                            disabled={cancelSubmitting}
                            className="px-3 py-1.5 rounded-lg text-[11.5px] font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            {cancelSubmitting ? "Cancelling…" : "Yes, Cancel Order"}
                          </button>
                          <button
                            onClick={() => setCancelConfirming(false)}
                            className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-[#111827]/60"
                          >
                            Keep Order
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancelConfirming(true)}
                          className="text-[11.5px] font-bold text-red-600 hover:text-red-700 transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div>
                  <p className="text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28 mb-3">Items</p>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item: any) => {
                      const p = item.product || item.products
                      const canReturn = selectedOrder.order_status === "delivered"
                      const alreadyRequested = returnedItemIds.includes(item.id)
                      const formOpen = returnFormItemId === item.id
                      return (
                        <div key={item.id} className="py-2" style={{ borderBottom: "1px solid rgba(17,24,39,0.04)" }}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#FBF9F5] shrink-0">
                              {p?.images?.[0] ? (
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Image</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-[#111827] truncate">{p?.name || "Product"}</p>
                              <p className="text-[11px] text-[#111827]/40 mt-0.5">Qty: {item.quantity} · {formatCurrency(item.price)} each</p>
                            </div>
                            <span className="text-[14px] font-black text-[#111827] shrink-0">{formatCurrency(item.total)}</span>
                          </div>

                          {canReturn && (
                            <div className="mt-2 ml-16">
                              {alreadyRequested ? (
                                <p className="text-[11px] font-semibold text-green-700 flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5" /> Return requested — we&apos;ll review it shortly.
                                </p>
                              ) : formOpen ? (
                                <div className="p-3 rounded-[4px] space-y-2" style={{ background: "#ffffff" }}>
                                  <select
                                    value={returnReason}
                                    onChange={e => setReturnReason(e.target.value)}
                                    className="w-full h-9 px-2.5 rounded-lg text-[12px] outline-none"
                                    style={{ border: "1px solid rgba(17,24,39,0.14)", background: "white", color: "#111827" }}
                                  >
                                    <option value="damaged">Item arrived damaged</option>
                                    <option value="wrong_product">Wrong item received</option>
                                    <option value="not_as_described">Not as described</option>
                                    <option value="quality_issue">Quality issue</option>
                                    <option value="other">Other</option>
                                  </select>
                                  <textarea
                                    value={returnDescription}
                                    onChange={e => setReturnDescription(e.target.value)}
                                    placeholder="Describe the issue (at least 10 characters)..."
                                    className="w-full min-h-[70px] px-2.5 py-2 rounded-lg text-[12px] outline-none resize-none"
                                    style={{ border: "1px solid rgba(17,24,39,0.14)", background: "white", color: "#111827" }}
                                  />
                                  {returnError && <p className="text-[11px] text-red-600">{returnError}</p>}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRequestReturn(selectedOrder.id, item.id)}
                                      disabled={returnSubmitting}
                                      className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-black text-[#111827] disabled:opacity-50"
                                      style={{ background: "#FACC15" }}
                                    >
                                      {returnSubmitting ? "Submitting…" : "Submit Request"}
                                    </button>
                                    <button
                                      onClick={() => { setReturnFormItemId(null); setReturnError("") }}
                                      className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-bold text-[#111827]/60"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setReturnFormItemId(item.id); setReturnError("") }}
                                  className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#111827]/60 hover:text-[#111827] transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Request Return / Refund
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Shipping & Billing grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28 mb-2">Delivery Address</p>
                    {selectedOrder.shipping_address ? (() => {
                      const addr = selectedOrder.shipping_address
                      return (
                        <div className="text-[12px] text-[#111827]/70 space-y-0.5">
                          <p className="font-bold text-[#111827]">{addr.name}</p>
                          <p>{addr.address_line1}</p>
                          {addr.address_line2 && <p>{addr.address_line2}</p>}
                          <p>{addr.city}, {addr.state_code || addr.state} — {addr.pincode}</p>
                          <p className="text-[#111827]/45 mt-1">Phone: {addr.phone}</p>
                        </div>
                      )
                    })() : (
                      <p className="text-[12px] text-[#111827]/40">No address details available.</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[9.5px] font-black uppercase tracking-widest text-[#111827]/28 mb-2">Billing Details</p>
                    <div className="space-y-1.5 text-[12.5px]">
                      <div className="flex justify-between text-[#111827]/60">
                        <span>Subtotal</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-[#111827]/60">
                        <span>Shipping</span>
                        <span>{selectedOrder.shipping_cost > 0 ? formatCurrency(selectedOrder.shipping_cost) : "Free"}</span>
                      </div>
                      {selectedOrder.tax > 0 && (
                        <div className="flex justify-between text-[#111827]/60">
                          <span>GST / Tax</span>
                          <span>{formatCurrency(selectedOrder.tax)}</span>
                        </div>
                      )}
                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Discount</span>
                          <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-[#111827] pt-2" style={{ borderTop: "1px solid rgba(17,24,39,0.06)" }}>
                        <span>Total</span>
                        <span className="text-[15px]">{formatCurrency(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-2xl">
                <button onClick={() => setSelectedOrder(null)} className="px-5 py-2 rounded-[4px] text-[12px] font-bold text-[#111827] bg-[#eeeeee] hover:bg-black/5 transition-colors cursor-pointer">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function OrderTrackingStepper({ order }: { order: any }) {
  if (order.order_status === "cancelled") {
    return (
      <p className="flex items-center gap-1.5 text-red-600 font-bold text-[13px]">
        <X className="w-4 h-4" /> Order Cancelled
      </p>
    )
  }

  const currentIndex = ORDER_STEPS.findIndex(s => s.key === order.order_status)
  const timestamps: Record<string, string | null> = {
    pending: order.created_at,
    confirmed: order.confirmed_at || null,
    processing: null,
    shipped: order.shipped_at || null,
    delivered: order.delivered_at || null,
  }

  return (
    <div className="flex items-start w-full">
      {ORDER_STEPS.map((step, i) => {
        const done = currentIndex >= 0 && i <= currentIndex
        const isLast = i === ORDER_STEPS.length - 1
        const ts = timestamps[step.key]
        return (
          <div key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center shrink-0 w-12">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                done ? "bg-[#111827] text-white" : "bg-[#111827]/10 text-[#111827]/30"
              }`}>
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`mt-1 text-[9px] font-semibold text-center leading-tight ${done ? "text-[#111827]" : "text-[#111827]/35"}`}>
                {step.label}
              </span>
              {ts && (
                <span className="text-[8px] text-[#111827]/35 mt-0.5 whitespace-nowrap">
                  {new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-0.5 mb-4 ${i < currentIndex ? "bg-[#111827]" : "bg-[#111827]/10"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <motion.div className="flex flex-col items-center justify-center py-20 bg-white rounded-[4px]"
      style={{ border: "1px solid rgba(17,24,39,0.07)" }}
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
      <div className="w-14 h-14 rounded-[4px] flex items-center justify-center mb-4"
        style={{ background: "rgba(250,204,21,0.15)" }}>
        <Icon className="w-6 h-6 text-[#111827]/30" />
      </div>
      <h3 className="font-bold text-[14px] text-[#111827] mb-1">{title}</h3>
      <p className="text-[12px] text-[#111827]/40 text-center max-w-xs">{subtitle}</p>
    </motion.div>
  )
}

export default function AccountPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FBF9F5" }}>
        <Loader2 className="w-7 h-7 animate-spin text-[#111827]/30" />
      </div>
    }>
      <AccountPageContent />
    </React.Suspense>
  )
}
