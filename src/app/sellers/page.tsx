import Link from "next/link"
import type { Metadata } from "next"
import { MapPin, Award, Store } from "lucide-react"
import { createServiceClient } from "@/lib/supabase/admin"

export const metadata: Metadata = {
  title: "All Sellers | LoqMart",
  description: "Browse verified artisans, MSMEs and manufacturers selling handmade and machine-made products on LoqMart.",
}

// Re-fetch periodically so newly approved sellers show up without a full redeploy.
export const revalidate = 300

const STATE_NAMES: Record<string, string> = {
  RJ: "Rajasthan", UP: "Uttar Pradesh", MH: "Maharashtra", WB: "West Bengal",
  KA: "Karnataka", TN: "Tamil Nadu", OR: "Odisha", AP: "Andhra Pradesh",
  GJ: "Gujarat", JK: "Jammu & Kashmir", KL: "Kerala", BR: "Bihar",
}

interface SellerRow {
  id: string
  business_name: string
  owner_name: string | null
  state_code: string | null
  swadeshi_rank: number
  total_products: number
}

async function fetchSellers(): Promise<SellerRow[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("sellers")
      .select("id, business_name, owner_name, state_code, swadeshi_rank, total_products")
      .eq("approval_status", "approved")
      .order("swadeshi_rank", { ascending: false })
      .limit(60)
    if (error) { console.error("Sellers fetch error:", error); return [] }
    return data || []
  } catch (err) {
    console.error("Sellers fetch failed:", err)
    return []
  }
}

export default async function SellersPage() {
  const sellers = await fetchSellers()

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-white border-b border-[#1a1c1c]/8 py-12 px-6 text-center">
        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/40 block mb-3">Verified Partners</span>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#1a1c1c] mb-3">All Sellers</h1>
        <p className="text-[#1a1c1c]/50 max-w-xl mx-auto">
          GST-verified artisans, MSMEs and manufacturers, ranked by Swadeshi Rank.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {sellers.length === 0 ? (
          <div className="text-center py-24">
            <Store className="w-10 h-10 text-[#1a1c1c]/15 mx-auto mb-3" />
            <p className="text-[#1a1c1c]/40 font-medium">Seller profiles loading soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {sellers.map((seller) => {
              const initials = (seller.business_name || "?").split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()
              const stateName = STATE_NAMES[seller.state_code || ""] || seller.state_code || "India"
              return (
                <Link key={seller.id} href={`/seller/${seller.id}`}
                  className="group block bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  style={{ border: "1px solid rgba(26,28,28,0.07)" }}>
                  <div className="relative h-24 bg-gradient-to-br from-[#fcd020] to-[#e6b800]">
                    <div className="absolute -bottom-7 left-5">
                      <div className="w-14 h-14 rounded-full border-4 border-white bg-[#1a1c1c] flex items-center justify-center shadow-lg">
                        <span className="text-[#fcd020] font-black text-base">{initials}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-10 pb-5 px-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h2 className="font-extrabold text-[#1a1c1c] text-sm group-hover:text-[#725c00] transition-colors leading-tight">
                        {seller.business_name}
                      </h2>
                      {seller.swadeshi_rank > 0 && (
                        <div className="flex items-center gap-1 bg-[#fcd020]/30 px-2 py-1 rounded-full shrink-0">
                          <Award className="w-3 h-3 text-[#725c00]" />
                          <span className="text-[10px] font-black text-[#725c00]">{seller.swadeshi_rank}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#1a1c1c]/40 mt-2">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{stateName}</span>
                      <span>{seller.total_products || 0} products</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
