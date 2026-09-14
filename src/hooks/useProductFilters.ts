"use client"

import { useCallback, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export interface ProductFilters {
  mode: "handmade" | "machine_made" | null
  category: string[]
  state: string[]
  minPrice: number | null
  maxPrice: number | null
  rating: number | null
  discount: number | null
  inStock: boolean
  seller: string
  sort: string
  page: number
  q: string
}

const DEFAULT_SORT = "featured"

function parseFilters(searchParams: URLSearchParams): ProductFilters {
  const modeParam = searchParams.get("mode")
  return {
    mode: modeParam === "handmade" || modeParam === "machine_made" ? modeParam : null,
    category: searchParams.get("category")?.split(",").filter(Boolean) || [],
    state: searchParams.get("state")?.split(",").filter(Boolean) || [],
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null,
    rating: searchParams.get("rating") ? Number(searchParams.get("rating")) : null,
    discount: searchParams.get("discount") ? Number(searchParams.get("discount")) : null,
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
    if (next.mode) params.set("mode", next.mode)
    if (next.category.length) params.set("category", next.category.join(","))
    if (next.state.length) params.set("state", next.state.join(","))
    if (next.minPrice != null) params.set("minPrice", String(next.minPrice))
    if (next.maxPrice != null) params.set("maxPrice", String(next.maxPrice))
    if (next.rating != null) params.set("rating", String(next.rating))
    if (next.discount != null) params.set("discount", String(next.discount))
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
      category: [], state: [], minPrice: null, maxPrice: null,
      rating: null, discount: null, inStock: false, seller: "",
    })
  }, [update])

  const hasActiveFilters =
    filters.category.length > 0 || filters.state.length > 0 ||
    filters.minPrice != null || filters.maxPrice != null ||
    filters.rating != null || filters.discount != null ||
    filters.inStock || !!filters.seller

  return { filters, update, resetFilters, hasActiveFilters }
}
