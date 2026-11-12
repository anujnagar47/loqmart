"use client"

import { useCallback, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export interface ProductFilters {
  mode: "handmade" | "machine_made" | null
  giCertified: boolean
  handloom: boolean
  cluster: string[]
  category: string[]
  state: string[]
  rating: number | null
  inStock: boolean
  seller: string
  sort: string
  page: number
  q: string
}

const DEFAULT_SORT = "featured"

function parseFilters(searchParams: URLSearchParams): ProductFilters {
  const modeParam = searchParams.get("mode")
  const craftType = searchParams.get("craft_type")
  return {
    mode: craftType === "handcrafted" ? "handmade" : craftType === "contemporary" ? "machine_made"
      : modeParam === "handmade" || modeParam === "machine_made" ? modeParam : null,
    giCertified: searchParams.get("gi_certified") === "1",
    handloom: searchParams.get("handloom") === "1",
    cluster: searchParams.get("cluster")?.split(",").filter(Boolean) || [],
    category: searchParams.get("category")?.split(",").filter(Boolean) || [],
    state: searchParams.get("state")?.split(",").filter(Boolean) || [],
    rating: searchParams.get("rating") ? Number(searchParams.get("rating")) : null,
    inStock: searchParams.get("inStock") === "1",
    seller: searchParams.get("seller") || "",
    sort: searchParams.get("sort") || DEFAULT_SORT,
    page: searchParams.get("page") ? Math.max(1, Number(searchParams.get("page"))) : 1,
    q: searchParams.get("q") || "",
  }
}

/**
 * Single source of truth for every PLP filter/sort/page value — the URL.
 * Reading state from here (rather than useState) is what makes filters
 * shareable and makes browser back/forward actually work, neither of
 * which the previous two hand-duplicated PLP implementations did.
 */
export function useProductFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const update = useCallback((patch: Partial<ProductFilters>) => {
    const current = parseFilters(searchParams)
    const next: ProductFilters = { ...current, ...patch }
    // Any filter/sort change (anything but an explicit page change) goes
    // back to page 1 — staying on page 4 of a now-different result set
    // is a real "0 products" trap.
    if (!("page" in patch)) next.page = 1

    const params = new URLSearchParams()
    if (next.mode === "handmade") params.set("craft_type", "handcrafted")
    if (next.mode === "machine_made") params.set("craft_type", "contemporary")
    if (next.giCertified) params.set("gi_certified", "1")
    if (next.handloom) params.set("handloom", "1")
    if (next.cluster.length) params.set("cluster", next.cluster.join(","))
    if (next.category.length) params.set("category", next.category.join(","))
    if (next.state.length) params.set("state", next.state.join(","))
    if (next.rating != null) params.set("rating", String(next.rating))
    if (next.inStock) params.set("inStock", "1")
    if (next.seller) params.set("seller", next.seller)
    if (next.sort && next.sort !== DEFAULT_SORT) params.set("sort", next.sort)
    if (next.page > 1) params.set("page", String(next.page))
    if (next.q) params.set("q", next.q)

    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, pathname, router])

  const resetFilters = useCallback(() => {
    update({
      category: [], state: [], rating: null, inStock: false, seller: "",
      mode: null, giCertified: false, handloom: false, cluster: [],
    })
  }, [update])

  const hasActiveFilters =
    filters.category.length > 0 || filters.state.length > 0 ||
    filters.rating != null ||
    filters.inStock || !!filters.seller || filters.mode !== null || filters.giCertified ||
    filters.handloom || filters.cluster.length > 0

  return { filters, update, resetFilters, hasActiveFilters }
}
