"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Store, MapPin, ShieldCheck, Star, Package, ArrowRight, MessageSquare, Loader2 } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { formatCurrency } from "@/lib/utils"
import type { Seller, Product } from "@/types/database"
import { ChatWindow } from "@/components/chat-window"
import { createClient } from "@/lib/supabase/client"

export default function PublicSellerStorePage() {
  const params   = useParams()
  const sellerId = params.id as string

  const [seller,        setSeller]        = useState<Seller | null>(null)
  const [products,      setProducts]      = useState<Product[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [{ data: sellerRow }, { data: prods }, { data: { session } }] = await Promise.all([
        supabase.from("sellers").select("*").eq("id", sellerId).single(),
        supabase.from("products").select("*").eq("seller_id", sellerId).eq("approval_status", "approved").order("created_at", { ascending: false }).limit(12),
        supabase.auth.getSession(),
      ])

      setSeller(sellerRow)
      setProducts(prods || [])
      if (session?.user) setCurrentUserId(session.user.id)
      setLoading(false)
    }
    if (sellerId) load()
  }, [sellerId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#eeece8" }}>
      <Loader2 className="w-8 h-8 animate-spin text-[#1a1c1c]/30" />
    </div>
  )

  if (!seller) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#eeece8" }}>
      <div className="text-center">
        <Store className="w-12 h-12 text-[#1a1c1c]/15 mx-auto mb-4" />
        <h1 className="text-[22px] font-bold text-[#1a1c1c] mb-2">Seller not found</h1>
        <Link href="/" className="font-bold text-[#725c00] hover:underline">Back to home</Link>
      </div>
    </div>
  )

  const initials = seller.business_name
    ? seller.business_name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
    : "?"

  return (
    <div className="min-h-screen" style={{ background: "#eeece8" }}>
      {/* Banner */}
      <div className="relative h-56 md:h-64 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #231b00 0%, #3d2f00 100%)" }}>
        {seller.banner_url && (
          <div className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url('${seller.banner_url}')` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Seller header */}
        <div className="relative -mt-16 mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Logo */}
            <div className="w-28 h-28 bg-white rounded-2xl border-4 shadow-xl flex items-center justify-center shrink-0"
              style={{ borderColor: "#eeece8" }}>
              {seller.logo_url ? (
                <img src={seller.logo_url} alt={seller.business_name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-[26px] font-black" style={{ color: "#725c00" }}>{initials}</span>
              )}
            </div>

            <div className="flex-1 pt-2">
              <div className="flex flex-wrap gap-2 mb-3">
                {seller.gstin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black text-white"
                    style={{ background: "#16a34a" }}>
                    <ShieldCheck className="w-3 h-3" /> GST Verified
                  </span>
                )}
                {seller.approval_status === "approved" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black text-[#231b00]"
                    style={{ background: "#fcd020" }}>Approved Seller</span>
                )}
                {seller.city && seller.state_code && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#1a1c1c]"
                    style={{ border: "1px solid rgba(26,28,28,0.2)" }}>
                    <MapPin className="w-3 h-3" />{seller.city}, {seller.state_code}
                  </span>
                )}
              </div>
              <h1 className="text-[28px] font-extrabold text-[#1a1c1c] tracking-tight">{seller.business_name}</h1>
              {seller.owner_name && (
                <p className="text-[#1a1c1c]/50 text-[13px] mt-1">by {seller.owner_name}</p>
              )}
            </div>

            {/* Swadeshi Rank */}
            {seller.swadeshi_rank > 0 && (
              <div className="rounded-2xl px-6 py-4 text-center min-w-[130px] shrink-0"
                style={{ background: "#fcd020" }}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-5 h-5 fill-[#231b00] text-[#231b00]" />
                  <span className="text-[28px] font-black text-[#231b00]">{seller.swadeshi_rank}</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#231b00]/60">Swadeshi Rank</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 pb-16">
          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-5">
            {seller.description && (
              <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(26,28,28,0.07)" }}>
                <h2 className="font-bold text-[#1a1c1c] mb-3 text-[13px] uppercase tracking-wider">About</h2>
                <p className="text-[13px] text-[#1a1c1c]/55 leading-relaxed">{seller.description}</p>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(26,28,28,0.07)" }}>
              <h2 className="font-bold text-[#1a1c1c] mb-4 text-[13px] uppercase tracking-wider">Seller Stats</h2>
              <div className="space-y-3">
                {[
                  [Package,    "Total Products",    String(seller.total_products ?? 0)          ],
                  [Store,      "Orders Fulfilled",  (seller.total_orders ?? 0).toLocaleString() ],
                  [MapPin,     "Location",          seller.city || "—"                          ],
                ].map(([Icon, label, value]: any) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[12px] text-[#1a1c1c]/50">
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </div>
                    <span className="font-bold text-[#1a1c1c] text-[12px]">{value}</span>
                  </div>
                ))}
                {seller.gstin && (
                  <div className="pt-3" style={{ borderTop: "1px solid rgba(26,28,28,0.07)" }}>
                    <p className="text-[11px] text-[#1a1c1c]/35">GSTIN: {seller.gstin}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] text-[#1a1c1c]/50"
              style={{ background: "rgba(26,28,28,0.05)", border: "1px solid rgba(26,28,28,0.07)" }}>
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Use the chat icon below to message this seller</span>
            </div>
          </div>

          {/* Products grid */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[18px] font-extrabold text-[#1a1c1c]">
                Products ({products.length})
              </h2>
              <Link href={`/category?seller=${sellerId}`}
                className="flex items-center gap-1 text-[12px] font-bold text-[#725c00] hover:underline">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center" style={{ border: "1px solid rgba(26,28,28,0.07)" }}>
                <Package className="w-10 h-10 text-[#1a1c1c]/15 mx-auto mb-3" />
                <p className="font-bold text-[#1a1c1c]/40 text-[14px]">No products listed yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, i) => (
                  <motion.div key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {currentUserId && (
        <ChatWindow
          currentUserId={currentUserId}
          receiverId={seller.user_id}
          receiverName={seller.business_name}
        />
      )}
    </div>
  )
}
