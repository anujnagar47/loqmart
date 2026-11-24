"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import Link from "next/link"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import * as topojson from "topojson-client"
import { ArrowRight, BookOpen, MapPin, Package, Search, X } from "lucide-react"
import { INDIA_STATE_BY_NAME, INDIA_STATE_DATA, type IndiaStateData } from "@/lib/indiaStateData"
import { STATE_MAP_IMAGES, stateStoryByCode } from "@/lib/state-stories"
import { CATALOG_PRODUCTS } from "@/lib/catalog-search"
import styles from "./IndiaMap.module.css"

const INDIA_TOPO_JSON = "/maps/india-topo.json"

interface StateStats {
  stateName: string
  stateCode: string
  artisanCount: number
  productCount: number
}

interface MapProduct {
  id: string
  name: string
  slug: string
  price: number
  images?: string[]
  categories?: { id: string; name: string; slug: string } | null
  category?: { id: string; name: string; slug: string } | null
  catalogOnly?: boolean
}

function catalogHref(state: IndiaStateData) {
  return `/catalog?state=${encodeURIComponent(state.filterCodes[0] || state.id)}`
}

function StatePreview({
  state,
  stats,
  products,
  loadingProducts,
  close,
}: {
  state: IndiaStateData
  stats?: StateStats
  products: MapProduct[]
  loadingProducts: boolean
  close: () => void
}) {
  const categoryCounts = new Map<string, { id: string; name: string; count: number }>()
  for (const product of products) {
    const category = product.categories || product.category
    if (!category?.id || !category.name) continue
    const current = categoryCounts.get(category.id)
    categoryCounts.set(category.id, { id: category.id, name: category.name, count: (current?.count || 0) + 1 })
  }
  const topCategories = [...categoryCounts.values()].sort((a, b) => b.count - a.count).slice(0, 3)
  const story = state.filterCodes.map((code) => stateStoryByCode(code)).find(Boolean)
  const heritageImage = state.filterCodes.map((code) => STATE_MAP_IMAGES[code]).find(Boolean)
  const catalogProducts = CATALOG_PRODUCTS.filter((product) => state.filterCodes.includes(product.state_code || ""))
  const productCount = (stats?.productCount || 0) + catalogProducts.length
  const tagline = state.crafts.slice(0, 2).join(" & ")

  return (
    <article className={styles.previewCard}>
      <header className={styles.previewHeader} style={heritageImage ? { backgroundImage: `linear-gradient(90deg, rgb(35 27 0 / 82%) 0%, rgb(35 27 0 / 62%) 58%, rgb(35 27 0 / 38%) 100%), url("${heritageImage.src}")` } : undefined}>
        <button type="button" className={styles.previewClose} onClick={close} aria-label="Close state preview"><X size={17} /></button>
        <p className={styles.previewEyebrow}>Regional collection</p>
        <div className={styles.previewTitleRow}><h2>{state.name}</h2><span className={styles.countBadge}><Package size={13} />{productCount.toLocaleString("en-IN")} products</span></div>
        <p className={styles.previewTagline}>{state.name} <span>•</span> {tagline}</p>
      </header>
      <div className={styles.previewBody}>
        {topCategories.length > 0 && <div className={styles.categoryPills} aria-label={`Top product categories in ${state.name}`}>
          {topCategories.map((category, index) => <Link key={category.id} href={`/catalog?state=${encodeURIComponent(state.filterCodes[0] || state.id)}&category=${encodeURIComponent(category.id)}`} className={`${styles.categoryPill} ${styles[`categoryPill${index + 1}`]}`}>
            {category.name}
          </Link>)}
        </div>}
        <div className={styles.trendingSection}>
          <div className={styles.trendingHeading}><span>Featured products</span><Package size={14} aria-hidden="true" /></div>
          {loadingProducts ? <p className={styles.trendingEmpty}>Loading products from {state.name}…</p> : products.length ? (
            <div className={styles.productMiniGrid}>
              {products.slice(0, 3).map((product) => <Link href={product.catalogOnly ? `/catalog/${product.slug}` : `/product/${product.slug}`} key={product.id} className={styles.productMiniCard}>
                <span className={styles.productMiniImage}>{product.images?.[0] ? <img src={product.images[0]} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = "none" }} /> : null}</span>
                <span className={styles.productMiniName}>{product.name}</span>
                <span className={styles.productMiniPrice}>{product.price > 0 ? `₹${product.price.toLocaleString("en-IN")}` : "Price on request"}</span>
              </Link>)}
            </div>
          ) : <p className={styles.trendingEmpty}>No featured products are listed for this state yet.</p>}
        </div>
        <div className={styles.craftList} aria-label={`Craft traditions in ${state.name}`}>
          {state.crafts.slice(0, 3).map((craft) => <span key={craft} className={styles.craftTag}>{craft}</span>)}
        </div>
        {(story || heritageImage) && <Link href={story ? `/blog/states/${story.slug}` : `/state/${state.filterCodes[0]?.toLowerCase()}`} className={styles.storyPreview}>
          <BookOpen size={17} aria-hidden="true" />
          <span className={styles.storyPreviewText}><strong>{story ? `Read the ${state.name} story` : `Explore ${state.name} heritage`}</strong><small>{story?.focus || heritageImage?.alt}</small></span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>}
        <Link href={catalogHref(state)} className={styles.exploreButton}>
          Explore All {state.name} Products <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

export function IndiaMap() {
  const [geoData, setGeoData] = useState<any>(null)
  const [hoveredState, setHoveredState] = useState<IndiaStateData | null>(null)
  const [selectedState, setSelectedState] = useState<IndiaStateData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [stateStats, setStateStats] = useState<StateStats[]>([])
  const [productsByState, setProductsByState] = useState<Record<string, MapProduct[]>>({})
  const [productCountsByState, setProductCountsByState] = useState<Record<string, number>>({})
  const [loadingState, setLoadingState] = useState<string | null>(null)
  const mapCardRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const hoverClearRef = useRef<number | null>(null)
  const pointerAnchorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)
  const productsCache = useRef(new Map<string, MapProduct[]>())
  const activeState = hoveredState || selectedState

  useEffect(() => {
    mapCardRef.current?.querySelector("svg")?.setAttribute("preserveAspectRatio", "xMidYMid meet")
  }, [geoData])

  useEffect(() => {
    const controller = new AbortController()
    fetch(INDIA_TOPO_JSON, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Map data unavailable")
        return response.json()
      })
      .then((topology) => {
        const states = topology?.objects?.states
        if (states) setGeoData(topojson.feature(topology, states))
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Could not load India map:", error)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/states/stats", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!controller.signal.aborted) setStateStats(data?.states || []) })
      .catch((error) => { if (error.name !== "AbortError") console.error("Could not load regional inventory:", error) })
    return () => controller.abort()
  }, [])

  // Wait briefly before loading regional product previews so pointer movement does not trigger excess requests.
  useEffect(() => {
    if (!activeState || productsCache.current.has(activeState.id)) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoadingState(activeState.id)
      const params = new URLSearchParams({ state: activeState.filterCodes.join(","), sort: "sold_desc", limit: "12", page: "1" })
      fetch(`/api/products?${params}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (controller.signal.aborted) return
          const liveProducts = (data?.products || []) as MapProduct[]
          const catalogProducts = CATALOG_PRODUCTS.filter((product) => activeState.filterCodes.includes(product.state_code || "")).map((product) => ({
            id: product.slug, slug: product.slug, name: product.name, price: product.price, images: product.images,
            catalogOnly: true,
            category: { id: product.specifications.craft_family, name: product.specifications.craft_family, slug: product.specifications.craft_family.toLowerCase().replaceAll(" ", "-") },
          }))
          const products = [...liveProducts, ...catalogProducts]
          productsCache.current.set(activeState.id, products)
          setProductsByState((current) => ({ ...current, [activeState.id]: products }))
          setProductCountsByState((current) => ({ ...current, [activeState.id]: Number(data?.total) || 0 }))
          setLoadingState(null)
        })
        .catch((error) => {
          if (error.name !== "AbortError") setLoadingState(null)
        })
    }, 220)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [activeState])

  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    if (!query) return []
    return INDIA_STATE_DATA.filter((state) =>
      state.name.toLocaleLowerCase().includes(query) ||
      state.slug.includes(query.replaceAll(" ", "-")) ||
      state.crafts.some((craft) => craft.toLocaleLowerCase().includes(query))
    ).slice(0, 7)
  }, [searchQuery])

  const getStateStats = useCallback((state: IndiaStateData) =>
    stateStats.find((stat) => state.filterCodes.includes(stat.stateCode) || stat.stateName.toLocaleLowerCase() === state.name.toLocaleLowerCase()),
  [stateStats])

  const previewStats = (state: IndiaStateData) => {
    const stats = getStateStats(state)
    const liveProductCount = productCountsByState[state.id]
    const catalogProductCount = CATALOG_PRODUCTS.filter((product) => state.filterCodes.includes(product.state_code || "")).length
    if (!stats && liveProductCount == null && catalogProductCount === 0) return undefined
    return {
      stateName: state.name,
      stateCode: state.id,
      artisanCount: stats?.artisanCount || 0,
      productCount: (liveProductCount ?? stats?.productCount ?? 0) + catalogProductCount,
    }
  }

  const setAnchorFromPointer = () => {
    if (pointerAnchorRef.current.x && pointerAnchorRef.current.y) {
      setPopoverAnchor(pointerAnchorRef.current)
      return
    }
    const rect = mapCardRef.current?.getBoundingClientRect()
    if (rect) setPopoverAnchor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }

  const previewState = (state: IndiaStateData) => {
    setSelectedState(state)
    setHoveredState(null)
    setSearchQuery(state.name)
    setSearchOpen(false)
    setAnchorFromPointer()
  }

  const selectState = (state: IndiaStateData) => {
    setSelectedState(state)
    setHoveredState(null)
    setAnchorFromPointer()
  }

  const clearHoveredSoon = () => {
    if (selectedState) return
    if (hoverClearRef.current) window.clearTimeout(hoverClearRef.current)
    hoverClearRef.current = window.setTimeout(() => setHoveredState(null), 180)
  }

  const visibleState = activeState
  const visibleProducts = visibleState ? productsByState[visibleState.id] || [] : []
  const productLoading = !!visibleState && loadingState === visibleState.id

  useEffect(() => {
    if (!activeState || !popoverAnchor) return
    const place = () => {
      const bounds = previewRef.current?.getBoundingClientRect()
      const width = bounds?.width || 380
      const height = bounds?.height || 480
      const gap = 14
      let x = popoverAnchor.x + gap
      if (x + width > window.innerWidth - 12) x = popoverAnchor.x - width - gap
      x = Math.max(12, Math.min(x, window.innerWidth - width - 12))
      const y = Math.max(12, Math.min(popoverAnchor.y - height * 0.45, window.innerHeight - height - 12))
      setPopoverPosition({ x, y })
    }
    place()
    window.addEventListener("resize", place)
    return () => window.removeEventListener("resize", place)
  }, [activeState, popoverAnchor, visibleProducts.length])

  const resetMap = () => {
    setHoveredState(null)
    setSelectedState(null)
    setSearchQuery("")
    setPopoverAnchor(null)
    setPopoverPosition(null)
    setSearchOpen(false)
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Regional craft, one place at a time</p>
        <h1>Shop India by state</h1>
        <p className={styles.subtitle}>Explore the makers and traditions behind products from across India.</p>
      </header>

      <section className={styles.explorer} aria-label="Explore India by state">
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              role="combobox"
              aria-label="Search states or crafts"
              aria-expanded={searchOpen && suggestions.length > 0}
              aria-controls="state-search-results"
              placeholder="Type a state or craft name…"
              value={searchQuery}
              onChange={(event) => { setSearchQuery(event.target.value); setSearchOpen(true); setSelectedState(null); setHoveredState(null) }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && suggestions[0]) previewState(suggestions[0])
                if (event.key === "Escape") setSearchOpen(false)
              }}
            />
            {searchQuery && <button type="button" aria-label="Clear search" onClick={() => { setSearchQuery(""); setSearchOpen(false); setSelectedState(null) }}><X size={16} /></button>}
            {searchOpen && searchQuery && (
              <div className={styles.searchResults} id="state-search-results" role="listbox">
                {suggestions.length ? suggestions.map((state) => (
                  <button key={state.id} type="button" role="option" aria-selected={activeState?.id === state.id} onClick={() => previewState(state)}>
                    <MapPin size={15} aria-hidden="true" /><span>{state.name}</span><small>{state.crafts[0]}</small>
                  </button>
                )) : <p>No states or crafts match that search.</p>}
              </div>
            )}
          </div>
          <button type="button" className={styles.resetButton} onClick={resetMap}>All India</button>
        </div>

        <div className={styles.mobileStateStrip} aria-label="Choose a state">
          {INDIA_STATE_DATA.map((state) => (
            <button type="button" key={state.id} aria-pressed={selectedState?.id === state.id} onClick={() => selectState(state)}>
              {state.name}
            </button>
          ))}
        </div>

        <div className={styles.mapLayout}>
          <div className={styles.mapColumn}>
            <div className={styles.mapHeading}>
              <div><h2>Explore the map</h2><p>Hover to preview, select a state to browse its collection.</p></div>
              <span className={styles.coverage}><MapPin size={14} /> 28 states · 8 union territories</span>
            </div>
            <div ref={mapCardRef} className={styles.mapCard} onMouseLeave={clearHoveredSoon} onPointerMove={(event) => { pointerAnchorRef.current = { x: event.clientX, y: event.clientY } }}>
              {geoData ? (
                <div className={styles.mapCanvas}>
                <ComposableMap
                  width={900}
                  height={760}
                  projection="geoMercator"
                  projectionConfig={{ scale: 850, center: [82.3, 22.3] }}
                  className={styles.mapSvg}
                  viewBox="0 0 900 760"
                  aria-label="Interactive map of India"
                >
                  <Geographies geography={geoData}>
                    {({ geographies }: { geographies: any[] }) => geographies.map((geography: any) => {
                      const state = INDIA_STATE_BY_NAME.get(String(geography.properties?.st_nm || "").toLocaleLowerCase())
                      if (!state) return null
                      const inventory = getStateStats(state)
                      const hasLiveProducts = (productCountsByState[state.id] ?? inventory?.productCount ?? 0) + CATALOG_PRODUCTS.filter((product) => state.filterCodes.includes(product.state_code || "")).length > 0
                      const isActive = visibleState?.id === state.id
                      return (
                        <Geography
                          key={geography.rsmKey}
                          geography={geography}
                          role="button"
                          tabIndex={0}
                          aria-label={`${state.name}${inventory?.productCount ? `, ${inventory.productCount} listed products` : ""}`}
                          aria-pressed={selectedState?.id === state.id}
                          onMouseEnter={() => {
                            if (hoverClearRef.current) window.clearTimeout(hoverClearRef.current)
                            setHoveredState(state)
                            setAnchorFromPointer()
                          }}
                          onFocus={() => { setHoveredState(state); setAnchorFromPointer() }}
                          onBlur={() => { if (!selectedState) clearHoveredSoon() }}
                          onClick={() => selectState(state)}
                          onKeyDown={(event: KeyboardEvent<SVGPathElement>) => {
                            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectState(state) }
                          }}
                          className={styles.statePath}
                          style={{
                            default: { fill: isActive ? "#EAB308" : hasLiveProducts ? "#FEF3C7" : "#FFFBEB", stroke: "#D6C69A", strokeWidth: 0.75, outline: "none", transition: "fill 150ms ease, stroke 150ms ease" },
                            hover: { fill: "#FACC15", stroke: "#A16207", strokeWidth: 1.5, outline: "none", cursor: "pointer", filter: "drop-shadow(0 2px 3px rgba(120, 86, 0, 0.18))" },
                            pressed: { fill: "#EAB308", stroke: "#854D0E", strokeWidth: 1.5, outline: "none" },
                          }}
                        />
                      )
                    })}
                  </Geographies>
                </ComposableMap>
                </div>
              ) : (
                <div className={styles.mapLoading} aria-live="polite">Loading India map…</div>
              )}
              <div className={styles.mapLegend}>
                <span><i className={styles.inventoryDot} /> Products listed</span>
                <span><i className={styles.neutralDot} /> Browse all regions</span>
              </div>
            </div>
          </div>


        </div>
      </section>

      {visibleState && <div
        ref={previewRef}
        className={styles.floatingPreview}
        style={{ left: `${popoverPosition?.x ?? 12}px`, top: `${popoverPosition?.y ?? 12}px` }}
        onMouseEnter={() => { if (hoverClearRef.current) window.clearTimeout(hoverClearRef.current) }}
        onMouseLeave={() => { if (!selectedState) setHoveredState(null) }}
      >
        <StatePreview state={visibleState} stats={previewStats(visibleState)} products={visibleProducts} loadingProducts={productLoading} close={() => { setSelectedState(null); setHoveredState(null) }} />
      </div>}
    </main>
  )
}
