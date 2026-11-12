"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import * as topojson from "topojson-client"
import { ArrowRight, MapPin, Package, Search, Store, X } from "lucide-react"
import { INDIA_STATE_BY_NAME, INDIA_STATE_DATA, type IndiaStateData } from "@/lib/indiaStateData"
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
  sellers?: { id: string; business_name: string; swadeshi_rank?: number | null } | null
}

function catalogHref(state: IndiaStateData) {
  return `/category?state=${encodeURIComponent(state.filterCodes.join(","))}`
}

function StatePreview({
  state,
  stats,
  products,
  loadingProducts,
  heroImage,
  close,
}: {
  state: IndiaStateData
  stats?: StateStats
  products: MapProduct[]
  loadingProducts: boolean
  heroImage?: string
  close?: () => void
}) {
  const makers = Array.from(new Map(products
    .map((product) => product.sellers)
    .filter((seller): seller is NonNullable<MapProduct["sellers"]> => !!seller?.id && !!seller.business_name)
    .map((seller) => [seller.id, seller])).values()).slice(0, 4)

  return (
    <article className={styles.previewCard}>
      <div className={styles.previewImage}>
        <img
          src={heroImage || state.image}
          loading="lazy"
          alt={`${state.name} craft traditions`}
          className={styles.previewImageAsset}
          onError={(event) => {
            if (heroImage && event.currentTarget.src !== state.image) event.currentTarget.src = state.image
            else event.currentTarget.style.visibility = "hidden"
          }}
        />
        <span className={styles.regionBadge}>{state.region}</span>
        {close && <button type="button" className={styles.closeSheet} onClick={close} aria-label="Close state preview"><X size={18} /></button>}
      </div>
      <div className={styles.previewBody}>
        <div className={styles.previewHeading}>
          <div>
            <p className={styles.previewEyebrow}>Explore the region</p>
            <h2>{state.name}</h2>
          </div>
          <MapPin aria-hidden="true" size={18} />
        </div>
        <p className={styles.previewSummary}>
          {stats?.productCount
            ? `${stats.productCount.toLocaleString("en-IN")} listed products from ${stats.artisanCount.toLocaleString("en-IN")} approved sellers`
            : "Browse local makers, materials and regional craft traditions."}
        </p>
        <div className={styles.craftList} aria-label={`Craft traditions in ${state.name}`}>
          {state.crafts.slice(0, 3).map((craft) => <span key={craft} className={styles.craftTag}>{craft}</span>)}
        </div>

        {state.giTagsCount > 0 && <p className={styles.giCount}>{state.giTagsCount} products with reviewed GI marks</p>}

        <div className={styles.trendingSection}>
          <div className={styles.trendingHeading}><span>Popular in {state.name}</span><Package size={14} /></div>
          {loadingProducts ? (
            <p className={styles.trendingEmpty}>Loading regional products…</p>
          ) : products.length ? (
            <div className={styles.trendingList}>
              {products.slice(0, 4).map((product) => (
                <Link href={`/product/${product.slug}`} key={product.id} className={styles.trendingProduct}>
                  <span>{product.name}</span><ArrowRight size={14} aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.trendingEmpty}>Explore the collection to see available products.</p>
          )}
        </div>

        {makers.length > 0 && (
          <div className={styles.makersSection}>
            <p>Makers to discover</p>
            <div>{makers.map((maker) => (
              <span key={maker.id} title={maker.swadeshi_rank ? `Swadeshi rank ${maker.swadeshi_rank}` : undefined}>
                {maker.business_name}
                {maker.swadeshi_rank ? <small>Rank {maker.swadeshi_rank}</small> : null}
              </span>
            ))}</div>
          </div>
        )}

        <Link href={catalogHref(state)} className={styles.exploreButton} onClick={close}>
          View products from {state.name}<ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

export function IndiaMap() {
  const router = useRouter()
  const [geoData, setGeoData] = useState<any>(null)
  const [hoveredState, setHoveredState] = useState<IndiaStateData | null>(null)
  const [selectedState, setSelectedState] = useState<IndiaStateData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [stateStats, setStateStats] = useState<StateStats[]>([])
  const [productsByState, setProductsByState] = useState<Record<string, MapProduct[]>>({})
  const [productCountsByState, setProductCountsByState] = useState<Record<string, number>>({})
  const [loadingState, setLoadingState] = useState<string | null>(null)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const productsCache = useRef(new Map<string, MapProduct[]>())
  const activeState = hoveredState || selectedState

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

  // Wait for a brief pause on a region before requesting its top products.
  // This keeps pointer movement cheap and avoids a request for every state crossed.
  useEffect(() => {
    if (!activeState || productsCache.current.has(activeState.id)) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoadingState(activeState.id)
      const params = new URLSearchParams({ state: activeState.filterCodes.join(","), inStock: "1", sort: "sold_desc", limit: "4", page: "1" })
      fetch(`/api/products?${params}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (controller.signal.aborted) return
          const products = (data?.products || []).slice(0, 4) as MapProduct[]
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
    if (!stats && liveProductCount == null) return undefined
    return {
      stateName: state.name,
      stateCode: state.id,
      artisanCount: stats?.artisanCount || 0,
      productCount: liveProductCount ?? stats?.productCount ?? 0,
    }
  }

  const previewState = (state: IndiaStateData) => {
    setSelectedState(state)
    setHoveredState(null)
    setSearchQuery(state.name)
    setSearchOpen(false)
  }

  const selectState = (state: IndiaStateData) => {
    setSelectedState(state)
    setHoveredState(null)
    if (window.matchMedia("(max-width: 767px)").matches) {
      setMobileSheetOpen(true)
    } else {
      router.push(catalogHref(state))
    }
  }

  const resetMap = () => {
    setHoveredState(null)
    setSelectedState(null)
    setSearchQuery("")
    setSearchOpen(false)
    setMobileSheetOpen(false)
    router.replace("/india-map", { scroll: false })
  }

  const visibleState = activeState
  const visibleProducts = visibleState ? productsByState[visibleState.id] || [] : []
  const productLoading = !!visibleState && loadingState === visibleState.id
  const heroImage = visibleProducts.find((product) => product.images?.[0])?.images?.[0]

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
            <div className={styles.mapCard} onMouseLeave={() => setHoveredState(null)}>
              {geoData ? (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ scale: 1050, center: [82.3, 22.3] }}
                  className={styles.mapSvg}
                  viewBox="0 0 800 680"
                  aria-label="Interactive map of India"
                >
                  <Geographies geography={geoData}>
                    {({ geographies }: { geographies: any[] }) => geographies.map((geography: any) => {
                      const state = INDIA_STATE_BY_NAME.get(String(geography.properties?.st_nm || "").toLocaleLowerCase())
                      if (!state) return null
                      const inventory = getStateStats(state)
                      const hasLiveProducts = (productCountsByState[state.id] ?? inventory?.productCount ?? 0) > 0
                      const isActive = visibleState?.id === state.id
                      return (
                        <Geography
                          key={geography.rsmKey}
                          geography={geography}
                          role="button"
                          tabIndex={0}
                          aria-label={`${state.name}${inventory?.productCount ? `, ${inventory.productCount} listed products` : ""}`}
                          aria-pressed={selectedState?.id === state.id}
                          onMouseEnter={() => setHoveredState(state)}
                          onFocus={() => setHoveredState(state)}
                          onBlur={() => setHoveredState(null)}
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
              ) : (
                <div className={styles.mapLoading} aria-live="polite">Loading India map…</div>
              )}
              <div className={styles.mapLegend}>
                <span><i className={styles.inventoryDot} /> Products listed</span>
                <span><i className={styles.neutralDot} /> Browse all regions</span>
              </div>
            </div>
          </div>

          <aside className={styles.detailPanel} aria-live="polite">
            {visibleState ? (
              <StatePreview state={visibleState} stats={previewStats(visibleState)} products={visibleProducts} loadingProducts={productLoading} heroImage={heroImage} />
            ) : (
              <div className={styles.emptyPreview}>
                <div className={styles.emptyIcon}><Store size={22} /></div>
                <h2>Find a regional collection</h2>
                <p>Choose a state on the map or search by place and craft to see its traditions and available products.</p>
                <span>Every state and union territory is included</span>
              </div>
            )}
          </aside>
        </div>
      </section>

      {mobileSheetOpen && visibleState && (
        <div className={styles.sheetBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileSheetOpen(false) }}>
          <div className={styles.mobileSheet} role="dialog" aria-modal="true" aria-label={`${visibleState.name} collection`}>
            <div className={styles.sheetHandle} />
            <StatePreview state={visibleState} stats={previewStats(visibleState)} products={visibleProducts} loadingProducts={productLoading} heroImage={heroImage} close={() => setMobileSheetOpen(false)} />
          </div>
        </div>
      )}
    </main>
  )
}
