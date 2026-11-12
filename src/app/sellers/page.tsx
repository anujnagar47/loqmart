import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { Award, MapPin, Package, ShoppingBag, Store } from "lucide-react"
import { createServiceClient } from "@/lib/supabase/admin"

export const metadata: Metadata = {
  title: "All Sellers | LoqMart",
  description: "Browse artisans, small businesses and manufacturers selling on LoqMart.",
}

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
  city: string | null
  address: string | null
  logo_url: string | null
  banner_url: string | null
  swadeshi_rank: number
  swadeshi_score: number
  total_products: number
  total_orders: number
}

async function fetchSellers(): Promise<SellerRow[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("sellers")
      .select("id, business_name, owner_name, state_code, city, address, logo_url, banner_url, swadeshi_rank, swadeshi_score, total_products, total_orders")
      .eq("approval_status", "approved")
      .order("swadeshi_score", { ascending: false })
      .order("total_orders", { ascending: false })
      .limit(60)
    if (error) { console.error("Sellers fetch error:", error); return [] }
    return (data || []) as SellerRow[]
  } catch (err) {
    console.error("Sellers fetch failed:", err)
    return []
  }
}

export default async function SellersPage() {
  const sellers = await fetchSellers()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#e8e4da] bg-white px-4 py-8 sm:px-6 md:py-10">
        <div className="mx-auto max-w-7xl">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#111827]">Meet the sellers</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">Shops from across India</h1>
          <p className="mt-1 max-w-xl text-sm leading-5 text-[#4B5563]">Explore approved sellers, their products and where they are based.</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 md:py-10">
        {sellers.length === 0 ? (
          <div className="flex flex-col items-start gap-3 border-y border-[#e8e4da] py-6 text-sm text-[#4B5563] sm:flex-row sm:items-center">
            <Store className="h-5 w-5 text-[#111827]" />
            <p>Seller profiles are temporarily unavailable.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sellers.map((seller, index) => {
              const initials = seller.business_name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase()
              const stateName = (seller.state_code && STATE_NAMES[seller.state_code]) || seller.state_code
              const location = [seller.address, seller.city, stateName].filter(Boolean).join(", ")
              return (
                <Link
                  key={seller.id}
                  href={`/seller/${seller.id}`}
                  className="group flex min-h-[290px] flex-col border border-[#E5E7EB] bg-white transition-colors hover:border-[#EAB308] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EAB308]"
                >
                  <div className="relative h-32 shrink-0 overflow-hidden border-b border-[#e8e4da] bg-white">
                    {seller.banner_url ? (
                      <Image src={seller.banner_url} alt="" fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
                    ) : seller.logo_url ? (
                      <Image src={seller.logo_url} alt="" fill sizes="(max-width: 640px) 100vw, 25vw" className="object-contain p-5" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl font-semibold text-[#111827]" aria-hidden="true">{initials}</div>
                    )}
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 border border-[#E5E7EB] bg-white px-2 py-1 text-[10px] font-semibold text-[#4B5563]">
                      <Award className="h-3 w-3 text-[#111827]" /> Top seller {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="line-clamp-2 text-sm font-bold leading-5 text-[#111827] group-hover:text-[#111827]">{seller.business_name}</h2>
                    {seller.owner_name && <p className="mt-1 truncate text-xs text-[#4B5563]">{seller.owner_name}</p>}
                    {location && <p className="mt-3 line-clamp-2 flex items-start gap-1.5 text-xs leading-4 text-[#4B5563]"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#111827]" />{location}</p>}
                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e8e4da] pt-3 text-xs text-[#4B5563]">
                      <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" />{seller.total_products ?? 0} products</span>
                      <span className="inline-flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" />{seller.total_orders ?? 0} orders</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
