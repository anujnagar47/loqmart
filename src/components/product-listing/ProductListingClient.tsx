"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, ArrowUpDown, X, Star, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, MapPin } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useProductFilters } from "@/hooks/useProductFilters"
import type { Product } from "@/types/database"
import { CRAFT_CLUSTERS, displayCategoryName } from "@/lib/craft-taxonomy"
import { SponsoredSlot } from "@/components/sponsored-slot"

const RATING_OPTIONS = [4, 3, 2]

const SORT_OPTIONS = [
  { value: "featured",       label: "Featured"           },
  { value: "created_at_desc", label: "Newest First"      },
  { value: "rating_desc",    label: "Highest Rated"      },
  { value: "sold_desc",      label: "Most Popular"       },
]

interface CategoryOption { id: string; name: string; slug: string }
interface StateOption { stateCode: string; stateName: string; productCount: number }

interface ProductListingProps {
  title: string
  subtitle?: string
  eyebrow?: string
  /** Fixed to a single category (from /category/[slug]) — hides the Category filter since the URL already picked it. */
  anchorCategory?: { id: string; name: string }
  initialProducts?: Product[]
  initialTotal?: number
  initialError?: boolean
}

export function ProductListingClient({
  title, subtitle, eyebrow, anchorCategory, initialProducts, initialTotal, initialError,
}: ProductListingProps) {
  const { filters, update, resetFilters, hasActiveFilters } = useProductFilters()

  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [total,    setTotal]    = useState(initialTotal ?? initialProducts?.length ?? 0)
  const [totalPages, setTotalPages] = useState(() => Math.max(1, Math.ceil((initialTotal ?? initialProducts?.length ?? 0) / 24)))
  const [loading,  setLoading]  = useState(!initialProducts)
  const [error,    setError]    = useState(Boolean(initialError))
  const [retryCount, setRetryCount] = useState(0)

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [states,     setStates]     = useState<StateOption[]>([])

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mobileSortOpen,    setMobileSortOpen]    = useState(false)

  const isFirstRun = useRef(true)

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
    if (isFirstRun.current && initialProducts && !initialError) {
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
    if (filters.mode === "handmade") params.set("craft_type", "handcrafted")
    if (filters.mode === "machine_made") params.set("craft_type", "contemporary")
    if (filters.giCertified) params.set("gi_certified", "1")
    if (filters.handloom) params.set("handloom", "1")
    if (filters.cluster.length) params.set("cluster", filters.cluster.join(","))
    if (anchorCategory) params.set("category", anchorCategory.id)
    else if (filters.category.length) params.set("category", filters.category.join(","))
    if (filters.state.length) params.set("state", filters.state.join(","))
    if (filters.rating != null) params.set("rating", String(filters.rating))
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
  }, [filters, anchorCategory, initialProducts, initialError, retryCount])

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
      <div className="bg-white border-b border-[#111827]/8 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-3">
            <Link href="/" className="hover:text-[#111827]">Home</Link>
            <span>/</span>
            <span className="text-[#111827]/60 font-medium">{title}</span>
          </nav>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
            <div>
              {eyebrow && (
                <span className="text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant block mb-2">{eyebrow}</span>
              )}
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#111827]">{title}</h1>
              {subtitle && <p className="text-on-surface-variant mt-1 text-sm">{subtitle}</p>}
              <p className="text-on-surface-variant mt-1.5 text-sm" aria-live="polite">
                {error ? "Products temporarily unavailable" : loading ? "Loading products…" : `${total.toLocaleString("en-IN")} product${total === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="hidden md:block text-xs text-on-surface-variant">Filter by craft, origin and production method</div>
          </div>
        </div>
      </div>

      <div className="sticky top-14 md:top-24 z-20 border-b border-[#111827]/10 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 pt-2 pb-3 md:px-6">
          <div className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Filter by craft and provenance">
            {[
              { key: "all", label: "All", active: !filters.mode && !filters.giCertified && !filters.handloom, action: () => update({ mode: null, giCertified: false, handloom: false }) },
              { key: "handcrafted", label: "100% Handcrafted", active: filters.mode === "handmade" && !filters.handloom, action: () => update({ mode: "handmade", giCertified: false, handloom: false }) },
              { key: "gi", label: "GI-Certified Origin", active: filters.giCertified, action: () => update({ mode: null, giCertified: !filters.giCertified, handloom: false }) },
              { key: "handloom", label: "Heritage Loom / Handloom", active: filters.handloom, action: () => update({ mode: "handmade", giCertified: false, handloom: !filters.handloom }) },
              { key: "contemporary", label: "Precision Loom / Contemporary Crafted", active: filters.mode === "machine_made", action: () => update({ mode: "machine_made", giCertified: false, handloom: false }) },
            ].map(item => (
              <button key={item.key} type="button" onClick={item.action}
                aria-pressed={item.active}
                title={item.key === "handcrafted" ? "Seller-listed handcrafted production. Guild and certification marks appear only after marketplace review." : item.key === "gi" ? "Only products whose GI origin evidence has been reviewed by LoqMart." : item.key === "handloom" ? "Only products whose handloom evidence has been reviewed by LoqMart." : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${item.active ? "border-[#725c00] bg-[#fcd020] text-[#231b00]" : "border-[#d0c6ac] bg-white text-[#4d4632] hover:bg-[#f3f3f3]"}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pt-2" aria-label="Explore by state and craft cluster">
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#4d4632]"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Origin</span>
            {CRAFT_CLUSTERS.map(cluster => {
              const selected = filters.cluster.includes(cluster.slug)
              return <button key={cluster.slug} type="button"
                onClick={() => update({ cluster: selected ? filters.cluster.filter(value => value !== cluster.slug) : [...filters.cluster, cluster.slug] })}
                aria-pressed={selected}
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${selected ? "bg-[#725c00] text-white" : "bg-[#f3f3f3] text-[#4d4632] hover:bg-[#eeeeee]"}`}>
                {cluster.label}
              </button>
            })}
          </div>
        </div>
      </div>

      {/* Sticky mobile filter+sort bar */}
      <div className="sticky top-[132px] z-20 md:hidden bg-white border-b border-[#111827]/8 px-4 py-2.5 flex gap-2">
        <button onClick={() => setMobileFiltersOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#ffffff] border border-[#111827]/10 rounded-[4px] text-sm font-semibold">
          <Filter className="w-4 h-4" /> Filters {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" />}
        </button>
        <button onClick={() => setMobileSortOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#ffffff] border border-[#111827]/10 rounded-[4px] text-sm font-semibold">
          <ArrowUpDown className="w-4 h-4" /> Sort
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8">
        <div className="flex items-start gap-6 lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-60 lg:w-64 shrink-0">
            <div className="sticky top-28 rounded-[4px] border border-[#111827]/12 bg-white px-4 py-4 shadow-sm">
              <div className="border-b border-[#111827]/10 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-extrabold tracking-tight text-[#111827]">Filters</h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">Narrow your results</p>
                </div>
              </div>
              <FilterPanel
                filters={filters} update={update} resetFilters={resetFilters} hasActiveFilters={hasActiveFilters}
                categories={anchorCategory ? [] : categories} states={states}
              />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Desktop sort bar */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <ActiveFilterChips filters={filters} update={update} states={states} categories={categories} />
              <div className="flex items-center gap-2 text-sm text-[#111827]/50 shrink-0 ml-auto">
                <span className="font-medium">Sort:</span>
                <select value={filters.sort} onChange={e => update({ sort: e.target.value })}
                  className="bg-transparent font-semibold text-[#111827] focus:outline-none cursor-pointer">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="md:hidden mb-4">
              <ActiveFilterChips filters={filters} update={update} states={states} categories={categories} />
            </div>

            {error ? (
              <div className="text-center py-24">
                <AlertCircle className="w-10 h-10 text-on-surface-variant mx-auto mb-3" />
                <p className="text-lg font-bold text-on-surface mb-1">Could not load products</p>
                <p className="text-sm text-on-surface-variant">Please check your connection and try again.</p>
                <button onClick={() => setRetryCount(value => value + 1)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-[#111827] text-sm font-semibold rounded-[4px]">
                  <RefreshCw className="w-4 h-4" /> Try again
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[4px] border border-[#111827]/10 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-[#FBF9F5]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-[#FBF9F5] rounded w-3/4" />
                      <div className="h-3 bg-[#FBF9F5] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-xl font-bold text-on-surface mb-2">No products found</p>
                <p className="text-sm text-on-surface-variant mb-6">Try adjusting your filters{filters.q ? " or search" : ""}.</p>
                {hasActiveFilters && (
                  <Button type="button" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <SponsoredSlot placement="search_top" />
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
                    filters.sort === o.value ? "bg-[#FACC15]/25 text-[#111827]" : "text-[#111827]/60"
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
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#111827]/8">
          <h3 className="font-black text-[#111827]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-[4px] bg-[#ffffff] flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </>
  )
}

function FilterPanel({
  filters, update, resetFilters, hasActiveFilters, categories, states,
}: {
  filters: ReturnType<typeof useProductFilters>["filters"]
  update: ReturnType<typeof useProductFilters>["update"]
  resetFilters: () => void
  hasActiveFilters: boolean
  categories: CategoryOption[]
  states: StateOption[]
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
              <CheckRow key={c.id} checked={filters.category.includes(c.id)} onChange={() => toggleCategory(c.id)} label={displayCategoryName(c)} />
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

      <FilterCard label="Rating">
        <div className="space-y-2">
          {RATING_OPTIONS.map(r => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="radio" name="rating" checked={filters.rating === r}
                onChange={() => update({ rating: filters.rating === r ? null : r })}
                className="w-4 h-4 accent-[#FACC15]" />
              <span className="flex items-center gap-1 text-sm font-medium text-[#111827]/70 group-hover:text-[#111827]">
                {r}<Star className="w-3 h-3 fill-[#FACC15] text-[#FACC15]" /> & up
              </span>
            </label>
          ))}
        </div>
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

function FilterCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pb-4 mb-4 border-b border-[#E5E7EB]/70 last:border-0 last:mb-0 last:pb-0">
      <h3 className="text-[13px] font-bold leading-5 text-[#111827] mb-3">{label}</h3>
      {children}
    </div>
  )
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex min-h-6 items-center gap-2.5 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 shrink-0 rounded border-[#111827]/25 accent-[#FACC15]" />
      <span className="min-w-0 text-sm leading-5 font-medium text-[#4B5563] group-hover:text-[#111827]">{label}</span>
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

  if (filters.mode === "handmade") chips.push({ key: "craft-handmade", label: "Handcrafted", onRemove: () => update({ mode: null }) })
  if (filters.mode === "machine_made") chips.push({ key: "craft-contemporary", label: "Contemporary crafted", onRemove: () => update({ mode: null }) })
  if (filters.giCertified) chips.push({ key: "gi", label: "GI-Certified Origin", onRemove: () => update({ giCertified: false }) })
  if (filters.handloom) chips.push({ key: "handloom", label: "Handloom Certified", onRemove: () => update({ handloom: false, mode: null }) })
  filters.cluster.forEach(slug => {
    const cluster = CRAFT_CLUSTERS.find(option => option.slug === slug)
    if (cluster) chips.push({ key: `cluster-${slug}`, label: cluster.label, onRemove: () => update({ cluster: filters.cluster.filter(value => value !== slug) }) })
  })

  filters.category.forEach(id => {
    const c = categories.find(c => c.id === id)
    if (c) chips.push({ key: `cat-${id}`, label: displayCategoryName(c), onRemove: () => update({ category: filters.category.filter(x => x !== id) }) })
  })
  filters.state.forEach(code => {
    const s = states.find(s => s.stateCode === code)
    chips.push({ key: `state-${code}`, label: s?.stateName || code, onRemove: () => update({ state: filters.state.filter(x => x !== code) }) })
  })
  if (filters.rating != null) chips.push({ key: "rating", label: `${filters.rating}★ & up`, onRemove: () => update({ rating: null }) })
  if (filters.seller) chips.push({ key: "seller", label: `Seller: ${filters.seller}`, onRemove: () => update({ seller: "" }) })
  if (filters.inStock) chips.push({ key: "stock", label: "In Stock", onRemove: () => update({ inStock: false }) })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(c => (
        <span key={c.key} className="inline-flex items-center gap-1 px-3 py-1 bg-[#FACC15]/30 text-[#111827] text-xs font-bold rounded-full">
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
        className="w-9 h-9 rounded-[4px] flex items-center justify-center bg-white border border-[#111827]/10 disabled:opacity-30">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-[#111827]/30 text-sm">…</span>}
          <button onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-[4px] text-sm font-bold ${p === page ? "text-[#111827]" : "bg-white border border-[#111827]/10 text-[#111827]/60"}`}
            style={p === page ? { background: "#FACC15" } : undefined}>
            {p}
          </button>
        </span>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="w-9 h-9 rounded-[4px] flex items-center justify-center bg-white border border-[#111827]/10 disabled:opacity-30">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
