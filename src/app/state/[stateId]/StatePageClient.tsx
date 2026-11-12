"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Users, Package, Award, ChevronLeft, Loader2 } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import type { Product, Seller } from "@/types/database"

interface StateInfo {
  name: string
  state_code: string
  description: string
  artisan_count: number
  product_count: number
  loqcoin_bonus: number
}

interface StateData {
  state: StateInfo | null
  products: Product[]
  featured_artisans: Seller[]
  isLoading: boolean
  error: string | null
}

const STATE_CODE_MAP: Record<string, string> = {
  "andaman-and-nicobar-islands": "AN",
  "andhra-pradesh": "AP",
  "arunachal-pradesh": "AR",
  "assam": "AS",
  "bihar": "BR",
  "chandigarh": "CH",
  "chhattisgarh": "CT",
  "dadra-and-nagar-haveli": "DN",
  "daman-and-diu": "DD",
  "delhi": "DL",
  "goa": "GA",
  "gujarat": "GJ",
  "haryana": "HR",
  "himachal-pradesh": "HP",
  "jammu-and-kashmir": "JK",
  "jharkhand": "JH",
  "karnataka": "KA",
  "kerala": "KL",
  "ladakh": "LA",
  "lakshadweep": "LD",
  "madhya-pradesh": "MP",
  "maharashtra": "MH",
  "manipur": "MN",
  "meghalaya": "ML",
  "mizoram": "MZ",
  "nagaland": "NL",
  "odisha": "OR",
  "puducherry": "PY",
  "punjab": "PB",
  "rajasthan": "RJ",
  "sikkim": "SK",
  "tamil-nadu": "TN",
  "telangana": "TG",
  "tripura": "TR",
  "uttar-pradesh": "UP",
  "uttarakhand": "UA",
  "west-bengal": "WB",
}

export const STATE_NAMES: Record<string, string> = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CT: "Chhattisgarh",
  DN: "Dadra and Nagar Haveli",
  DD: "Daman and Diu",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JK: "Jammu and Kashmir",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha",
  PY: "Puducherry",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TG: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UA: "Uttarakhand",
  WB: "West Bengal",
}

const STATE_BG_IMAGES: Record<string, string> = {
  RJ: "https://images.unsplash.com/photo-1599661559684-6ea0c5e7b5f9?w=1200&h=600&fit=crop",
  UP: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&h=600&fit=crop",
  KA: "https://images.unsplash.com/photo-1600100397608-f010f41cb8ed?w=1200&h=600&fit=crop",
  MH: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=1200&h=600&fit=crop",
  TN: "https://images.unsplash.com/photo-1582510003544-4d00b7f7415e?w=1200&h=600&fit=crop",
  WB: "https://images.unsplash.com/photo-1558431382-27e303142255?w=1200&h=600&fit=crop",
  GJ: "https://images.unsplash.com/photo-1603228254119-e6a4d0f5f403?w=1200&h=600&fit=crop",
  KL: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&h=600&fit=crop",
  AS: "https://images.unsplash.com/photo-1589136777351-fdc9c9cb15c4?w=1200&h=600&fit=crop",
  OR: "https://images.unsplash.com/photo-1629215034606-9ab50c5344d5?w=1200&h=600&fit=crop",
  JK: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1200&h=600&fit=crop",
  DEFAULT: "https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=1200&h=600&fit=crop",
}

function slugToStateCode(slug: string): string {
  return STATE_CODE_MAP[slug] || slug.toUpperCase().slice(0, 2)
}

export function StatePageClient() {
  const params    = useParams()
  const stateId   = params.stateId as string
  const stateCode = slugToStateCode(stateId)
  const stateName = STATE_NAMES[stateCode] || stateId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const [data, setData] = useState<StateData>({
    state: null, products: [], featured_artisans: [], isLoading: true, error: null,
  })
  const [selectedMode, setSelectedMode] = useState<"handmade" | "machine_made">("handmade")

  useEffect(() => {
    async function fetchStateData() {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }))
        const response = await fetch(`/api/state/${stateCode}`)
        if (!response.ok) throw new Error("Failed to fetch state data")
        const result = await response.json()
        setData({
          state: result.state || {
            name: stateName, state_code: stateCode,
            description: `Explore authentic ${stateName} crafts and handmade products from verified artisans.`,
            artisan_count: 0, product_count: 0, loqcoin_bonus: 10,
          },
          products:           result.products || [],
          featured_artisans:  result.artisans  || [],
          isLoading: false, error: null,
        })
      } catch (err) {
        setData({
          state: {
            name: stateName, state_code: stateCode,
            description: `Explore authentic ${stateName} crafts and handmade products from verified artisans.`,
            artisan_count: 0, product_count: 0, loqcoin_bonus: 10,
          },
          products: [], featured_artisans: [], isLoading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }
    if (stateCode) fetchStateData()
  }, [stateCode, stateName])

  if (data.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FBF9F5" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#111827]/30" />
          <p className="text-[#111827]/40 text-[13px]">Loading {stateName}...</p>
        </div>
      </div>
    )
  }

  const state = data.state!
  const filteredProducts = data.products.filter(p =>
    selectedMode === "handmade" ? p.mode === "handmade" : p.mode === "machine_made"
  )
  const bgImage = STATE_BG_IMAGES[stateCode] || STATE_BG_IMAGES.DEFAULT

  return (
    <div className="min-h-screen" style={{ background: "#FBF9F5" }}>
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px]">
        <div className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url('${bgImage}')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-6 pb-12 w-full">
            <Link href="/india-map"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors text-[13px]">
              <ChevronLeft className="w-4 h-4" /> Back to India Map
            </Link>
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black text-[#111827]"
                style={{ background: "#FACC15" }}>
                +{state.loqcoin_bonus}% LoqCoin Bonus
              </span>
            </div>
            <h1 className="text-[40px] md:text-[60px] font-extrabold text-white mb-4 tracking-tight">{state.name}</h1>
            <div className="flex flex-wrap gap-6 text-white/80 text-[14px]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{(state.artisan_count ?? 0).toLocaleString()} Artisans</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <span>{(state.product_count ?? 0).toLocaleString()} Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-[22px] font-extrabold text-[#111827] mb-4">About {state.name}</h2>
              <p className="text-[#111827]/55 leading-relaxed">{state.description}</p>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[22px] font-extrabold text-[#111827]">Featured Products</h2>
                <div className="flex gap-2">
                  {(["handmade", "machine_made"] as const).map((m) => (
                    <button key={m} onClick={() => setSelectedMode(m)}
                      className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: selectedMode === m ? "#FACC15" : "white",
                        color:      selectedMode === m ? "#111827" : "rgba(17,24,39,0.5)",
                        border:     selectedMode === m ? "none" : "1px solid rgba(17,24,39,0.12)",
                      }}>
                      {m === "handmade" ? "Handcrafted" : "Contemporary Crafted"}
                    </button>
                  ))}
                </div>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.slice(0, 6).map((product, i) => (
                    <motion.div key={product.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                  <Package className="w-10 h-10 mx-auto mb-4 text-[#111827]/15" />
                  <p className="text-[#111827]/40 text-[14px] mb-3">No products from {state.name} yet</p>
                  <Link href="/category" className="text-[13px] font-bold hover:underline" style={{ color: "#111827" }}>
                    Explore all categories
                  </Link>
                </div>
              )}
            </section>

            {data.featured_artisans.length > 0 && (
              <section>
                <h2 className="text-[22px] font-extrabold text-[#111827] mb-6">Top Artisans</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {data.featured_artisans.slice(0, 6).map((artisan, i) => (
                    <motion.div key={artisan.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden flex items-center justify-center"
                        style={{ border: "3px solid #FACC15", background: "#FBF9F5" }}>
                        {artisan.logo_url ? (
                          <img src={artisan.logo_url} alt={artisan.business_name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-8 h-8 text-[#111827]/25" />
                        )}
                      </div>
                      <h3 className="font-bold text-[#111827] text-[13px]">{artisan.business_name}</h3>
                      <p className="text-[11px] text-[#111827]/45">{artisan.owner_name}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 lg:top-28 space-y-5">
              <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(17,24,39,0.07)" }}>
                <h3 className="font-bold text-[#111827] mb-4 text-[13px] uppercase tracking-wider">State Highlights</h3>
                <div className="space-y-3">
                  {[
                    ["Artisans",      (state.artisan_count ?? 0).toLocaleString() ],
                    ["Products",      (state.product_count ?? 0).toLocaleString() ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[12px] text-[#111827]/50">{label}</span>
                      <span className="font-bold text-[#111827] text-[14px]">{value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#111827]/50">LoqCoin Bonus</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black text-[#111827]"
                      style={{ background: "#FACC15" }}>+{state.loqcoin_bonus}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: "#111827" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-6 h-6" style={{ color: "#FACC15" }} />
                  <h3 className="font-bold text-white text-[13px]">Swadeshi Rank</h3>
                </div>
                <p className="text-[12px] text-white/60 mb-4 leading-relaxed">
                  All sellers from {state.name} are verified and maintain a high Swadeshi Rank for quality assurance.
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link href={`/category?state=${stateCode}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-black text-[#111827]"
                  style={{ background: "#FACC15" }}>
                  Explore All {state.name} Products <ArrowRight size={14} />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
