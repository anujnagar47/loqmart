"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, ArrowUpDown, X, Star, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useProductFilters } from "@/hooks/useProductFilters"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/types/database"

// Fixed visual ceiling for the price slider — an "N+" label covers anything
// above it (the same pattern Amazon's own price slider uses), so this isn't
// a claim about the actual most-expensive product in the catalog.
const PRICE_CAP = 10000

const RATING_OPTIONS = [4, 3, 2]
const DISCOUNT_OPTIONS = [10, 20, 30, 50]

const SORT_OPTIONS = [
  { value: "featured",       label: "Featured"           },
  { value: "created_at_desc", label: "Newest First"      },
  { value: "price_asc",      label: "Price: Low to High" },
  { value: "price_desc",     label: "Price: High to Low" },
  { value: "rating_desc",    label: "Highest Rated"      },
  { value: "sold_desc",      label: "Most Popular"       },
  { value: "discount_desc",  label: "Best Discount"      },
]

interface CategoryOption { id: string; name: string; slug: string }
interface StateOption { stateCode: string; stateName: string; productCount: number }

interface ProductListingProps {
  title: string
  subtitle?: string
  eyebrow?: string
  /** Fixed to a single category (from /category/[slug]) — hides the Category filter since the URL already picked it. */
  anchorCategory?: { id: string; name: string }
  /** Fixed minimum discount% (from /deals) — hides the Discount filter since the page IS that filter. */
  anchorMinDiscount?: number
  initialProducts?: Product[]
  initialTotal?: number
}

export function ProductListingClient({
  title, subtitle, eyebrow, anchorCategory, anchorMinDiscount, initialProducts, initialTotal,
}: ProductListingProps) {
  const { filters, update, resetFilters, hasActiveFilters } = useProductFilters()

  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [total,    setTotal]    = useState(initialTotal ?? initialProducts?.length ?? 0)
  const [totalPages, setTotalPages] = useState(() => Math.max(1, Math.ceil((initialTotal ?? initialProducts?.length ?? 0) / 24)))
  const [loading,  setLoading]  = useState(!initialProducts)
  const [error,    setError]    = useState(false)

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [states,     setStates]     = useState<StateOption[]>([])

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mobileSortOpen,    setMobileSortOpen]    = useState(false)
  const [sellerInput,       setSellerInput]       = useState(filters.seller)

  const isFirstRun = useRef(true)
  const sellerDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch categories (for the sidebar filter) and states (real, only ones with products) once.
  useEffect(() => {
    if (!anchorCategory) {
      fetch("/api/categories").then(r => r.ok ? r.json() : null).then(d => {
        if (d?.categories) setCategories(d.categories)
      }).catch(() => {})
    }
    fetch("/api/states/stats").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.states) setStates(d.states)
    }).catch(() => {})
  }, [anchorCategory])

  // Fetch products whenever the URL-derived filters change. Uses an
  // AbortController so a fast filter change (e.g. typing in the seller
  // search) can't have an older, slower response overwrite a newer one.
  useEffect(() => {
    if (isFirstRun.current && initialProducts) {
      isFirstRun.current = false
      return
    }
    isFirstRun.current = false

    const controller = new AbortController()
    // Deferred rather than a synchronous setState at the top of the effect
    // body — avoids the extra render-during-render this would otherwise
    // cause, while still flipping to the loading state before the next paint.
    queueMicrotask(() => {
      if (!controller.signal.aborted) { setLoading(true); setError(false) }
    })

    const params = new URLSearchParams()
    if (filters.mode) params.set("mode", filters.mode)
    if (anchorCategory) params.set("category", anchorCategory.id)
    else if (filters.category.length) params.set("category", filters.category.join(","))
    if (filters.state.length) params.set("state", filters.state.join(","))
    if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice))
    if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice))
    if (filters.rating != null) params.set("rating", String(filters.rating))
    if (anchorMinDiscount != null) params.set("discount", String(anchorMinDiscount))
    else if (filters.discount != null) params.set("discount", String(filters.discount))
    if (filters.inStock) params.set("inStock", "1")
    if (filters.seller) params.set("seller", filters.seller)
    if (filters.q) params.set("q", filters.q)
    params.set("sort", filters.sort)
    params.set("page", String(filters.page))
    params.set("limit", "24")

    fetch(`/api/products?${params}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.json() })
      .then(d => {
        setProducts(d.products || [])
        setTotal(d.total || 0)
        setTotalPages(d.totalPages || 1)
        setLoading(false)
      })
      .catch(err => { if (err.name !== "AbortError") { setLoading(false); setError(true) } })

    return () => controller.abort()
  }, [filters, anchorCategory, anchorMinDiscount, initialProducts])

  const handleSellerChange = (value: string) => {
    setSellerInput(value)
    if (sellerDebounce.current) clearTimeout(sellerDebounce.current)
    sellerDebounce.current = setTimeout(() => update({ seller: value }), 400)
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Header */}
      <div className="bg-white border-b border-[#1a1c1c]/8 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-1.5 text-xs text-[#1a1c1c]/40 mb-3">
            <Link href="/" className="hover:text-[#1a1c1c]">Home</Link>
            <span>/</span>
            <span className="text-[#1a1c1c]/60 font-medium">{title}</span>
          </nav>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
            <div>
              {eyebrow && (
                <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1a1c1c]/40 block mb-2">{eyebrow}</span>
              )}
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]">{title}</h1>
              {subtitle && <p className="text-[#1a1c1c]/50 mt-1 text-sm">{subtitle}</p>}
              <p className="text-[#1a1c1c]/50 mt-1.5 text-sm">
                {loading ? "Loading…" : `${total.toLocaleString("en-IN")} product${total === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="flex bg-[#f8f5f0] border border-[#1a1c1c]/10 p-1 rounded-[4px]">
              {([null, "handmade", "machine_made"] as const).map((m) => (
                <button key={m ?? "all"} onClick={() => update({ mode: m })}
                  className={`px-4 py-2 rounded-[3px] text-xs font-black uppercase tracking-wider transition-all ${
                    filters.mode === m ? "bg-[#fcd020] text-[#1a1c1c] shadow-sm" : "text-[#1a1c1c]/50 hover:text-[#1a1c1c]"
                  }`}>
                  {m === null ? "All" : m === "handmade" ? "Handmade" : "Machine-Made"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile filter+sort bar */}
      <div className="sticky top-0 z-30 md:hidden bg-white border-b border-[#1a1c1c]/8 px-4 py-2.5 flex gap-2">
        <button onClick={() => setMobileFiltersOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#f8f5f0] border border-[#1a1c1c]/10 rounded-[4px] text-sm font-semibold">
          <Filter className="w-4 h-4" /> Filters {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#fcd020]" />}
        </button>
        <button onClick={() => setMobileSortOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#f8f5f0] border border-[#1a1c1c]/10 rounded-[4px] text-sm font-semibold">
          <ArrowUpDown className="w-4 h-4" /> Sort
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-60 shrink-0">
            <div className="sticky top-24 lg:top-28">
              <FilterPanel
                filters={filters} update={update} resetFilters={resetFilters} hasActiveFilters={hasActiveFilters}
                categories={anchorCategory ? [] : categories} states={states}
                hideDiscount={anchorMinDiscount != null}
                sellerInput={sellerInput} onSellerChange={handleSellerChange}
              />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Desktop sort bar */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <ActiveFilterChips filters={filters} update={update} states={states} categories={categories} />
              <div className="flex items-center gap-2 text-sm text-[#1a1c1c]/50 shrink-0 ml-auto">
                <span className="font-medium">Sort:</span>
                <select value={filters.sort} onChange={e => update({ sort: e.target.value })}
                  className="bg-transparent font-semibold text-[#1a1c1c] focus:outline-none cursor-pointer">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="md:hidden mb-4">
              <ActiveFilterChips filters={filters} update={update} states={states} categories={categories} />
            </div>

            {error ? (
              <div className="text-center py-24">
                <AlertCircle className="w-10 h-10 text-[#1a1c1c]/20 mx-auto mb-3" />
                <p className="text-lg font-bold text-[#1a1c1c]/40 mb-1">Could not load products</p>
                <p className="text-sm text-[#1a1c1c]/30">Please check your connection and try again.</p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[4px] border border-[#1a1c1c]/10 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-[#eeece8]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-[#eeece8] rounded w-3/4" />
                      <div className="h-3 bg-[#eeece8] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-xl font-bold text-[#1a1c1c]/40 mb-2">No products found</p>
                <p className="text-sm text-[#1a1c1c]/30 mb-6">Try adjusting your filters{filters.q ? " or search" : ""}.</p>
                {hasActiveFilters && (
                  <Button type="button" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                  {products.map((product, i) => (
                    <motion.div key={product.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
                <Pager page={filters.page} totalPages={totalPages} onChange={p => update({ page: p })} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <MobileSheet onClose={() => setMobileFiltersOpen(false)} title="Filters">
            <FilterPanel
              filters={filters} update={update} resetFilters={resetFilters} hasActiveFilters={hasActiveFilters}
              categories={anchorCategory ? [] : categories} states={states}
              hideDiscount={anchorMinDiscount != null}
              sellerInput={sellerInput} onSellerChange={handleSellerChange}
            />
            <Button type="button" onClick={() => setMobileFiltersOpen(false)} className="w-full mt-4">
              Show {total} Results
            </Button>
          </MobileSheet>
        )}
        {mobileSortOpen && (
          <MobileSheet onClose={() => setMobileSortOpen(false)} title="Sort By">
            <div className="space-y-1">
              {SORT_OPTIONS.map(o => (
                <button key={o.value}
                  onClick={() => { update({ sort: o.value }); setMobileSortOpen(false) }}
                  className={`w-full text-left px-4 py-3 rounded-[4px] text-sm font-semibold ${
                    filters.sort === o.value ? "bg-[#fcd020]/25 text-[#1a1c1c]" : "text-[#1a1c1c]/60"
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </MobileSheet>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <motion.div className="fixed inset-0 bg-black/40 z-40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden max-h-[80vh] overflow-y-auto"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#1a1c1c]/8">
          <h3 className="font-black text-[#1a1c1c]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-[4px] bg-[#f8f5f0] flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </>
  )
}

function FilterPanel({
  filters, update, resetFilters, hasActiveFilters, categories, states, hideDiscount, sellerInput, onSellerChange,
}: {
  filters: ReturnType<typeof useProductFilters>["filters"]
  update: ReturnType<typeof useProductFilters>["update"]
  resetFilters: () => void
  hasActiveFilters: boolean
  categories: CategoryOption[]
  states: StateOption[]
  hideDiscount?: boolean
  sellerInput: string
  onSellerChange: (v: string) => void
}) {
  const toggleState = (code: string) =>
    update({ state: filters.state.includes(code) ? filters.state.filter(s => s !== code) : [...filters.state, code] })
  const toggleCategory = (id: string) =>
    update({ category: filters.category.includes(id) ? filters.category.filter(c => c !== id) : [...filters.category, id] })

  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <FilterCard label="Category">
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {categories.map(c => (
              <CheckRow key={c.id} checked={filters.category.includes(c.id)} onChange={() => toggleCategory(c.id)} label={c.name} />
            ))}
          </div>
        </FilterCard>
      )}

      {states.length > 0 && (
        <FilterCard label="State">
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {states.map(s => (
              <CheckRow key={s.stateCode} checked={filters.state.includes(s.stateCode)} onChange={() => toggleState(s.stateCode)}
                label={`${s.stateName} (${s.productCount})`} />
            ))}
          </div>
        </FilterCard>
      )}

      <FilterCard label="Price">
        <PriceRangeSlider
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={(min, max) => update({ minPrice: min, maxPrice: max })}
        />
      </FilterCard>

      <FilterCard label="Rating">
        <div className="space-y-2">
          {RATING_OPTIONS.map(r => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="radio" name="rating" checked={filters.rating === r}
                onChange={() => update({ rating: filters.rating === r ? null : r })}
                className="w-4 h-4 accent-[#fcd020]" />
              <span className="flex items-center gap-1 text-sm font-medium text-[#1a1c1c]/70 group-hover:text-[#1a1c1c]">
                {r}<Star className="w-3 h-3 fill-[#fcd020] text-[#fcd020]" /> & up
              </span>
            </label>
          ))}
        </div>
      </FilterCard>

      {!hideDiscount && (
        <FilterCard label="Discount">
          <div className="space-y-2">
            {DISCOUNT_OPTIONS.map(d => (
              <label key={d} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="radio" name="discount" checked={filters.discount === d}
                  onChange={() => update({ discount: filters.discount === d ? null : d })}
                  className="w-4 h-4 accent-[#fcd020]" />
                <span className="text-sm font-medium text-[#1a1c1c]/70 group-hover:text-[#1a1c1c]">{d}% off or more</span>
              </label>
            ))}
          </div>
        </FilterCard>
      )}

      <FilterCard label="Seller">
        <input
          value={sellerInput}
          onChange={e => onSellerChange(e.target.value)}
          placeholder="Search seller name…"
          className="w-full h-9 px-3 rounded-[4px] text-sm outline-none"
          style={{ border: "1px solid rgba(26,28,28,0.14)", background: "#f8f5f0" }}
        />
      </FilterCard>

      <FilterCard label="Availability">
        <CheckRow checked={filters.inStock} onChange={() => update({ inStock: !filters.inStock })} label="In Stock Only" />
      </FilterCard>

      {hasActiveFilters && (
        <Button type="button" variant="secondary" onClick={resetFilters} className="w-full">
          Reset Filters
        </Button>
      )}
    </div>
  )
}

const RANGE_THUMB = "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#1a1c1c] [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#1a1c1c] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"

/** A real two-handle price range slider (native overlapping <input type="range">
 *  elements — no added dependency) bound to the URL's minPrice/maxPrice, in
 *  place of the old preset-bucket radio list. PRICE_CAP is a display ceiling
 *  ("₹10,000+"), not a claim about the catalog's real max price. */
function PriceRangeSlider({
  minPrice, maxPrice, onChange,
}: {
  minPrice: number | null
  maxPrice: number | null
  onChange: (min: number | null, max: number | null) => void
}) {
  const [localMin, setLocalMin] = useState(minPrice ?? 0)
  const [localMax, setLocalMax] = useState(maxPrice ?? PRICE_CAP)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Deferred via queueMicrotask (not a synchronous setState in the effect
  // body) so external filter changes — Reset Filters, removing this as an
  // active-filter chip — still move the slider, without tripping
  // react-hooks/set-state-in-effect.
  useEffect(() => { queueMicrotask(() => setLocalMin(minPrice ?? 0)) }, [minPrice])
  useEffect(() => { queueMicrotask(() => setLocalMax(maxPrice ?? PRICE_CAP)) }, [maxPrice])

  function commit(min: number, max: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange(min <= 0 ? null : min, max >= PRICE_CAP ? null : max)
    }, 400)
  }

  const STEP = 50
  function handleMinChange(v: number) {
    const next = Math.min(v, localMax - STEP)
    setLocalMin(next)
    commit(next, localMax)
  }
  function handleMaxChange(v: number) {
    const next = Math.max(v, localMin + STEP)
    setLocalMax(next)
    commit(localMin, next)
  }

  const minPct = (localMin / PRICE_CAP) * 100
  const maxPct = (localMax / PRICE_CAP) * 100

  return (
    <div>
      <div className="relative h-4 flex items-center mb-2">
        <div className="absolute left-0 right-0 h-1 bg-[#1a1c1c]/10 rounded-full" />
        <div className="absolute h-1 bg-[#fcd020] rounded-full" style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }} />
        <input
          type="range" min={0} max={PRICE_CAP} step={STEP} value={localMin}
          onChange={e => handleMinChange(Number(e.target.value))}
          aria-label="Minimum price"
          className={`absolute w-full h-4 m-0 appearance-none bg-transparent pointer-events-none ${RANGE_THUMB}`}
        />
        <input
          type="range" min={0} max={PRICE_CAP} step={STEP} value={localMax}
          onChange={e => handleMaxChange(Number(e.target.value))}
          aria-label="Maximum price"
          className={`absolute w-full h-4 m-0 appearance-none bg-transparent pointer-events-none ${RANGE_THUMB}`}
        />
      </div>
      <div className="flex items-center justify-between text-[12px] font-semibold text-[#1a1c1c]/70">
        <span>{formatCurrency(localMin)}</span>
        <span>{localMax >= PRICE_CAP ? `${formatCurrency(PRICE_CAP)}+` : formatCurrency(localMax)}</span>
      </div>
    </div>
  )
}

function FilterCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pb-4 mb-4 border-b border-[#1a1c1c]/10 last:border-0">
      <h3 className="text-[13px] font-bold text-[#1a1c1c] mb-2.5">{label}</h3>
      {children}
    </div>
  )
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded border-[#1a1c1c]/25 accent-[#fcd020]" />
      <span className="text-sm font-medium text-[#1a1c1c]/70 group-hover:text-[#1a1c1c] truncate">{label}</span>
    </label>
  )
}

function ActiveFilterChips({
  filters, update, states, categories,
}: {
  filters: ReturnType<typeof useProductFilters>["filters"]
  update: ReturnType<typeof useProductFilters>["update"]
  states: StateOption[]
  categories: CategoryOption[]
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = []

  filters.category.forEach(id => {
    const c = categories.find(c => c.id === id)
    if (c) chips.push({ key: `cat-${id}`, label: c.name, onRemove: () => update({ category: filters.category.filter(x => x !== id) }) })
  })
  filters.state.forEach(code => {
    const s = states.find(s => s.stateCode === code)
    chips.push({ key: `state-${code}`, label: s?.stateName || code, onRemove: () => update({ state: filters.state.filter(x => x !== code) }) })
  })
  if (filters.minPrice != null || filters.maxPrice != null) {
    const priceLabel = filters.minPrice != null && filters.maxPrice != null
      ? `${formatCurrency(filters.minPrice)} – ${formatCurrency(filters.maxPrice)}`
      : filters.minPrice != null
        ? `Above ${formatCurrency(filters.minPrice)}`
        : `Under ${formatCurrency(filters.maxPrice!)}`
    chips.push({ key: "price", label: priceLabel, onRemove: () => update({ minPrice: null, maxPrice: null }) })
  }
  if (filters.rating != null) chips.push({ key: "rating", label: `${filters.rating}★ & up`, onRemove: () => update({ rating: null }) })
  if (filters.discount != null) chips.push({ key: "discount", label: `${filters.discount}% off+`, onRemove: () => update({ discount: null }) })
  if (filters.seller) chips.push({ key: "seller", label: `Seller: ${filters.seller}`, onRemove: () => update({ seller: "" }) })
  if (filters.inStock) chips.push({ key: "stock", label: "In Stock", onRemove: () => update({ inStock: false }) })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(c => (
        <span key={c.key} className="inline-flex items-center gap-1 px-3 py-1 bg-[#fcd020]/30 text-[#1a1c1c] text-xs font-bold rounded-full">
          {c.label}
          <button onClick={c.onRemove}><X className="w-3 h-3" /></button>
        </span>
      ))}
    </div>
  )
}

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="w-9 h-9 rounded-[4px] flex items-center justify-center bg-white border border-[#1a1c1c]/10 disabled:opacity-30">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-[#1a1c1c]/30 text-sm">…</span>}
          <button onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-[4px] text-sm font-bold ${p === page ? "text-[#1a1c1c]" : "bg-white border border-[#1a1c1c]/10 text-[#1a1c1c]/60"}`}
            style={p === page ? { background: "#fcd020" } : undefined}>
            {p}
          </button>
        </span>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="w-9 h-9 rounded-[4px] flex items-center justify-center bg-white border border-[#1a1c1c]/10 disabled:opacity-30">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
