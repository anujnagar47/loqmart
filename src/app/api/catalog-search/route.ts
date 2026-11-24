import { NextRequest, NextResponse } from "next/server"
import { CATALOG_PRODUCTS, CATALOG_SELLERS, CATALOG_STATES, searchCatalog } from "@/lib/catalog-search"
import { fetchProductsList } from "@/lib/products"
import { rankSearchResults, type RecommendationItem } from "@/lib/recommendationEngine"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query = (params.get("q") || "").slice(0, 100)
  const limit = Math.max(1, Math.min(Number(params.get("limit") || 24), 60))
  let products = query ? searchCatalog(query, CATALOG_PRODUCTS.length) : CATALOG_PRODUCTS
  const liveResult = query ? await fetchProductsList({ q: query, sort: "rating_desc", limit: 24 }) : null
  const liveProducts = (liveResult?.products || []) as unknown as RecommendationItem[]

  const state = params.get("state")?.toUpperCase()
  const seller = params.get("seller")?.toLowerCase()
  const category = params.get("category")?.toLowerCase()
  const region = params.get("region")?.toLowerCase()
  const minPrice = Number(params.get("minPrice") || 0)
  const maxPrice = Number(params.get("maxPrice") || Number.MAX_SAFE_INTEGER)
  const inStock = params.get("inStock") === "1"
  products = products.filter(product => {
    const specs = product.specifications as Record<string, string>
    const sellerName = CATALOG_SELLERS[product.seller_id] || ""
    return (!state || product.state_code === state)
      && (!seller || sellerName.toLowerCase().includes(seller))
      && (!category || `${specs.craft_family || ""} ${product.name}`.toLowerCase().includes(category))
      && (!region || (specs.origin || "").toLowerCase().includes(region))
      && product.price >= minPrice && product.price <= maxPrice
      && (!inStock || product.stock > 0)
  })

  const sort = params.get("sort")
  if (sort === "price_asc") products.sort((a, b) => a.price - b.price)
  else if (sort === "price_desc") products.sort((a, b) => b.price - a.price)
  else if (sort === "title") products.sort((a, b) => a.name.localeCompare(b.name))

  const stateTokens = query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean)
  const stateSuggestions = Object.entries(CATALOG_STATES).map(([code, label]) => {
    const normalized = label.toLowerCase()
    const matched = stateTokens.some(token => normalized.includes(token) || normalized.split(" ").some(word => word.startsWith(token)))
    return matched ? { type: "state", id: code, label, detail: "State storefront · catalog items retain source region", href: `/state/${label.toLowerCase().replaceAll(" ", "-")}` } : null
  }).filter((item): item is NonNullable<typeof item> => item !== null).slice(0, 4)
  const productSuggestions = query
    ? rankSearchResults(query, [...liveProducts, ...products.filter(product => !liveProducts.some(live => live.slug === product.slug))] as RecommendationItem[], 6).map(({ item }) => {
        const isLive = "id" in item && !!item.id
        const specs = (item.specifications || {}) as Record<string, string>
        return { type: "product", id: item.slug, label: item.name, detail: specs.catalogue_code || item.categories?.name || item.category?.name || undefined, href: isLive ? `/product/${encodeURIComponent(item.slug)}` : `/catalog/${encodeURIComponent(item.slug)}`, image: Array.isArray(item.images) ? item.images[0] || null : null }
      })
    : []
  const groups = query ? {
    products: productSuggestions,
    sellers: [...new Set(products.map(product => CATALOG_SELLERS[product.seller_id]).filter(Boolean))].slice(0, 4).map(label => ({ type: "seller", id: label, label, detail: label === "Jaipur Billiards" ? "Catalog seller · verification pending" : "Marketplace seller", href: `/catalog?seller=${encodeURIComponent(label)}` })),
    states: stateSuggestions,
    categories: [...new Set(products.map(product => (product.specifications as Record<string, string>).craft_family).filter(Boolean))].slice(0, 4).map(label => ({ type: "category", id: label!, label: label!, detail: "Product category", href: `/catalog?category=${encodeURIComponent(label!)}` })),
  } : null

  const combinedTotal = query
    ? new Set([...products.map(product => product.slug), ...liveProducts.map(product => product.slug)]).size
    : products.length
  return NextResponse.json({ products: products.slice(0, limit), total: combinedTotal, groups, facets: {
    states: [...new Set(CATALOG_PRODUCTS.map(product => product.state_code).filter(Boolean))].map(code => ({ code, name: CATALOG_STATES[code!] || code, count: CATALOG_PRODUCTS.filter(product => product.state_code === code).length })),
    sellers: [...new Set(CATALOG_PRODUCTS.map(product => CATALOG_SELLERS[product.seller_id]).filter(Boolean))],
    categories: [...new Set(CATALOG_PRODUCTS.map(product => (product.specifications as Record<string, string>).craft_family).filter(Boolean))],
    price: { min: Math.min(...CATALOG_PRODUCTS.map(product => product.price)), max: Math.max(...CATALOG_PRODUCTS.map(product => product.price)) },
  } })
}
