"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, Grid, List, X, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { createClient } from "@/lib/supabase/client"
import type { Product } from "@/types/database"

const priceRanges = [
  { label: "Under ₹500",       min: 0,    max: 500   },
  { label: "₹500 – ₹1,000",   min: 500,  max: 1000  },
  { label: "₹1,000 – ₹2,500", min: 1000, max: 2500  },
  { label: "₹2,500 – ₹5,000", min: 2500, max: 5000  },
  { label: "Above ₹5,000",    min: 5000, max: Infinity },
]

const states = [
  { code: "RJ", name: "Rajasthan"       },
  { code: "UP", name: "Uttar Pradesh"   },
  { code: "MH", name: "Maharashtra"     },
  { code: "WB", name: "West Bengal"     },
  { code: "KA", name: "Karnataka"       },
  { code: "TN", name: "Tamil Nadu"      },
  { code: "OR", name: "Odisha"          },
  { code: "AP", name: "Andhra Pradesh"  },
  { code: "GJ", name: "Gujarat"         },
  { code: "JK", name: "Jammu & Kashmir" },
  { code: "KL", name: "Kerala"          },
  { code: "BR", name: "Bihar"           },
]

const sortOptions = [
  { value: "featured",   label: "Featured"             },
  { value: "newest",     label: "Newest First"         },
  { value: "price_low",  label: "Price: Low to High"   },
  { value: "price_high", label: "Price: High to Low"   },
  { value: "rating",     label: "Highest Rated"        },
  { value: "popular",    label: "Most Popular"         },
]

export default function CategorySlugPage() {
  return (
    <Suspense fallback={<CategoryLoading />}>
      <CategoryContent />
    </Suspense>
  )
}

function CategoryLoading() {
  return (
    <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#1a1c1c]/40" />
    </div>
  )
}

function CategoryContent() {
  const params     = useParams()
  const slug       = params?.slug as string
  const router     = useRouter()

  const searchParams = useSearchParams()
  const searchParam = searchParams.get("search") || ""

  const [category,          setCategory]        = useState<any | null>(null)
  const [categoryLoading,   setCategoryLoading] = useState(true)

  const [products,   setProducts]   = useState<Product[]>([])
  const [loading,    setLoading]    = useState(true)

  const [selectedMode,       setSelectedMode]       = useState<"handmade" | "machine_made">("handmade")
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null)
  const [selectedStates,     setSelectedStates]     = useState<string[]>([])
  const [inStockOnly,        setInStockOnly]        = useState(false)
  const [sortBy,             setSortBy]             = useState("featured")
  const [viewMode,           setViewMode]           = useState<"grid" | "list">("grid")
  const [showFilters,        setShowFilters]        = useState(false)

  // 1. Fetch Category metadata by slug
  useEffect(() => {
    if (!slug) return
    async function loadCategory() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", slug)
          .maybeSingle()

        if (data) {
          setCategory(data)
          // Set initial mode filter based on category metadata if specified
          if (data.mode) {
            setSelectedMode(data.mode)
          }
        }
      } catch (err) {
        console.error("Failed to load category metadata:", err)
      } finally {
        setCategoryLoading(false)
      }
    }
    loadCategory()
  }, [slug])

  // 2. Fetch Products filtered by category ID
  useEffect(() => {
    if (!category) return
    setLoading(true)
    const params = new URLSearchParams()
    params.set("category", category.id)
    params.set("mode", selectedMode)
    params.set("limit", "100")
    if (searchParam) params.set("q", searchParam)
    const sortMap: Record<string, string> = {
      newest: "created_at_desc", price_low: "price_asc", price_high: "price_desc",
      rating: "rating_desc", popular: "sold_desc",
    }
    params.set("sort", sortMap[sortBy] || "rating_desc")

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category, selectedMode, sortBy, searchParam])

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (inStockOnly) result = result.filter(p => p.stock > 0)
    if (selectedPriceRange !== null) {
      const r = priceRanges[selectedPriceRange]
      result = result.filter(p => p.price >= r.min && p.price < r.max)
    }
    if (selectedStates.length > 0) {
      result = result.filter(p => p.state_code && selectedStates.includes(p.state_code))
    }
    return result
  }, [products, inStockOnly, selectedPriceRange, selectedStates])

  const toggleState = (code: string) =>
    setSelectedStates(prev => prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code])

  const resetFilters = () => {
    setSelectedPriceRange(null)
    setSelectedStates([])
    setInStockOnly(false)
  }

  const hasActiveFilters = selectedPriceRange !== null || selectedStates.length > 0 || inStockOnly

  if (categoryLoading) {
    return <CategoryLoading />
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-[#1a1c1c]/20 mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-[#1a1c1c] mb-2">Category not found</h1>
          <p className="text-[#1a1c1c]/50 mb-6">We couldn't find the category you are looking for.</p>
          <Link href="/category" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#fcd020] text-[#1a1c1c] font-black rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Browse Categories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-white border-b border-[#1a1c1c]/8 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/40 block mb-2">
                {selectedMode === "handmade" ? "Artisan Crafts" : "Industrial Quality"}
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]">
                {category.name}
              </h1>
              <p className="text-[#1a1c1c]/50 mt-1.5 text-sm">{loading ? "…" : `${filteredProducts.length} products`}</p>
            </div>

            <div className="flex bg-[#f8f5f0] border border-[#1a1c1c]/10 p-1 rounded-xl">
              {(["handmade", "machine_made"] as const).map((m) => (
                <button key={m} onClick={() => setSelectedMode(m)}
                  className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    selectedMode === m
                      ? "bg-[#fcd020] text-[#1a1c1c] shadow-sm"
                      : "text-[#1a1c1c]/50 hover:text-[#1a1c1c]"
                  }`}>
                  {m === "handmade" ? "Handmade" : "Machine-Made"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <AnimatePresence>
            {(showFilters || true) && (
              <aside className={`${showFilters ? "block" : "hidden"} md:block w-56 shrink-0`}>
                <motion.div
                  className="sticky top-24 space-y-4"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-xl border border-[#1a1c1c]/8 p-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#1a1c1c]/50 mb-3">State</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-none">
                      {states.map((state) => (
                        <label key={state.code} className="flex items-center gap-2.5 cursor-pointer group">
                          <input type="checkbox"
                            checked={selectedStates.includes(state.code)}
                            onChange={() => toggleState(state.code)}
                            className="w-4 h-4 rounded border-[#1a1c1c]/25 accent-[#fcd020]"
                          />
                          <span className="text-sm font-medium text-[#1a1c1c]/70 group-hover:text-[#1a1c1c]">{state.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#1a1c1c]/8 p-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#1a1c1c]/50 mb-3">Price Range</h3>
                    <div className="space-y-2">
                      {priceRanges.map((range, index) => (
                        <label key={range.label} className="flex items-center gap-2.5 cursor-pointer group">
                          <input type="radio" name="price"
                            checked={selectedPriceRange === index}
                            onChange={() => setSelectedPriceRange(index)}
                            className="w-4 h-4 accent-[#fcd020]"
                          />
                          <span className="text-sm font-medium text-[#1a1c1c]/70 group-hover:text-[#1a1c1c]">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#1a1c1c]/8 p-5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox"
                        checked={inStockOnly}
                        onChange={() => setInStockOnly(!inStockOnly)}
                        className="w-4 h-4 rounded accent-[#fcd020]"
                      />
                      <span className="text-sm font-medium text-[#1a1c1c]/70">In Stock Only</span>
                    </label>
                  </div>

                  {hasActiveFilters && (
                    <button onClick={resetFilters}
                      className="w-full bg-[#1a1c1c] text-white py-2.5 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#1a1c1c]/90 transition-colors cursor-pointer">
                      Reset Filters
                    </button>
                  )}
                </motion.div>
              </aside>
            )}
          </AnimatePresence>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <button onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-[#1a1c1c]/10 rounded-lg text-sm font-semibold cursor-pointer">
                <Filter className="w-4 h-4" /> Filters
              </button>

              <div className="hidden md:flex items-center gap-2 text-sm text-[#1a1c1c]/50">
                <span className="font-medium">Sort:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="bg-transparent font-semibold text-[#1a1c1c] focus:outline-none cursor-pointer">
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white border border-[#1a1c1c]/10 rounded-lg p-1">
                {[["grid", Grid], ["list", List]].map(([v, Icon]: any) => (
                  <button key={v} onClick={() => setViewMode(v)}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === v ? "bg-[#fcd020]" : "hover:bg-[#f8f5f0]"}`}>
                    <Icon className="w-4 h-4 text-[#1a1c1c]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedStates.map(code => (
                  <span key={code} className="inline-flex items-center gap-1 px-3 py-1 bg-[#fcd020]/30 text-[#1a1c1c] text-xs font-bold rounded-full">
                    {states.find(s => s.code === code)?.name}
                    <button onClick={() => toggleState(code)} className="cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {selectedPriceRange !== null && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#fcd020]/30 text-[#1a1c1c] text-xs font-bold rounded-full">
                    {priceRanges[selectedPriceRange].label}
                    <button onClick={() => setSelectedPriceRange(null)} className="cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#fcd020]/30 text-[#1a1c1c] text-xs font-bold rounded-full">
                    In Stock
                    <button onClick={() => setInStockOnly(false)} className="cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a1c1c]/30" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-xl font-bold text-[#1a1c1c]/40 mb-2">No products found</p>
                <p className="text-sm text-[#1a1c1c]/30 mb-6">Try adjusting your filters or browse a different category.</p>
                <button onClick={resetFilters} className="px-5 py-2.5 rounded-xl text-[13px] font-black text-[#1a1c1c] cursor-pointer" style={{ background: "#fcd020" }}>Reset Filters</button>
              </div>
            ) : (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6" : "grid-cols-1 gap-4"}`}>
                {filteredProducts.map((product, i) => (
                  <motion.div key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
