import { createServiceClient } from "@/lib/supabase/admin"
import type { Product } from "@/types/database"

export interface ProductListParams {
  mode?: string | null
  /** Comma-separated category ids */
  category?: string | null
  /** Comma-separated state codes */
  state?: string | null
  minPrice?: number | null
  maxPrice?: number | null
  /** Minimum rating threshold, e.g. 4 = "4 stars & up" */
  rating?: number | null
  /** Minimum discount percentage, e.g. 20 = "20% off or more" */
  discount?: number | null
  inStock?: boolean
  /** Seller business name search text (not an id — matches the sidebar's free-text seller filter) */
  seller?: string | null
  sort?: string | null
  q?: string | null
  page?: number
  limit?: number
}

export interface ProductListResult {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const SELLER_FIELDS = "id, business_name, swadeshi_rank, state_code"

/**
 * Builds ProductListParams from a Next.js server-component `searchParams`
 * object — used by the SSR first-page fetch on /category and
 * /category/[slug] so the server-rendered first paint matches exactly
 * what the client-side fetch would request for the same URL (e.g. a
 * shared link that already has filters applied).
 */
export function parseProductListSearchParams(sp: Record<string, string | undefined>): ProductListParams {
  return {
    mode: sp.mode || null,
    category: sp.category || null,
    state: sp.state ? sp.state.toUpperCase() : null,
    minPrice: sp.minPrice ? Number(sp.minPrice) : null,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : null,
    rating: sp.rating ? Number(sp.rating) : null,
    discount: sp.discount ? Number(sp.discount) : null,
    inStock: sp.inStock === "1",
    seller: sp.seller || null,
    sort: sp.sort || "featured",
    q: sp.search || sp.q ? (sp.search || sp.q)!.slice(0, 100) : null,
    page: sp.page ? Number(sp.page) : 1,
    limit: 24,
  }
}

/**
 * The single implementation behind every product-listing surface —
 * /api/products, the SSR first-page fetch on /category and
 * /category/[slug], and (indirectly) the homepage rails that hit
 * /api/products. Previously this filter/sort logic was hand-duplicated
 * across three different files and had drifted (e.g. only this one
 * ever honored minPrice/maxPrice/state server-side).
 */
export async function fetchProductsList(params: ProductListParams): Promise<ProductListResult> {
  const supabase = createServiceClient()
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(60, Math.max(1, params.limit || 24))
  const offset = (page - 1) * limit

  // A seller-name filter requires an inner join so PostgREST can filter on
  // the embedded table's column — mirrors the pattern already used for
  // admin state-scope filtering.
  const sellerSelect = params.seller
    ? `sellers!inner(${SELLER_FIELDS})`
    : `sellers(${SELLER_FIELDS})`

  let query = supabase
    .from("products")
    .select(`*, ${sellerSelect}, categories(id, name, slug)`, { count: "exact" })
    .eq("approval_status", "approved")

  if (params.mode) query = query.eq("mode", params.mode)
  if (params.category) query = query.in("category_id", params.category.split(",").filter(Boolean))
  if (params.state) query = query.in("state_code", params.state.split(",").filter(Boolean))
  if (params.minPrice != null) query = query.gte("price", params.minPrice)
  if (params.maxPrice != null) query = query.lte("price", params.maxPrice)
  if (params.rating != null) query = query.gte("rating", params.rating)
  if (params.discount != null) query = query.gte("discount_percent", params.discount)
  if (params.inStock) query = query.gt("stock", 0)
  if (params.seller) query = query.ilike("sellers.business_name", `%${params.seller}%`)
  if (params.q) query = query.ilike("name", `%${params.q.slice(0, 100)}%`)

  switch (params.sort) {
    case "price_asc": query = query.order("price", { ascending: true }); break
    case "price_desc": query = query.order("price", { ascending: false }); break
    case "rating_desc": query = query.order("rating", { ascending: false }); break
    case "sold_desc": query = query.order("sold_count", { ascending: false }); break
    case "discount_desc": query = query.order("discount_percent", { ascending: false }); break
    // "Featured" now means something real (is_featured flag) rather than
    // silently falling back to rating_desc with no visible difference.
    case "featured": query = query.order("is_featured", { ascending: false }).order("rating", { ascending: false }); break
    case "created_at_desc":
    default: query = query.order("created_at", { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error("fetchProductsList error:", error)
    return { products: [], total: 0, page, limit, totalPages: 0 }
  }

  return {
    products: (data as unknown as Product[]) || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
  }
}
