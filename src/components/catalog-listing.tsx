"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CATALOG_SELLERS, CATALOG_STATES, PENDING_CATALOG_SELLER_IDS } from "@/lib/catalog-search"
import { CustomizationRequest, isFurnitureProduct } from "@/components/customization-request"
import { FallbackProductImage } from "@/components/fallback-product-image"
import { SponsoredSlot } from "@/components/sponsored-slot"
import { trackMarketplaceEvent } from "@/lib/analyticsTracker"

type ListingProduct = { seller_id: string; slug: string; name: string; images: string[]; price: number; stock: number; state_code: string | null; specifications: Record<string, string>; mode?: "handmade" | "machine_made" }

export function CatalogListing({ initialFilters }: { initialFilters: Record<string, string> }) {
  const router = useRouter()
  const [filters, setFilters] = useState(initialFilters)
  const [products, setProducts] = useState<ListingProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (next: Record<string, string>) => {
    setLoading(true)
    const qs = new URLSearchParams(next)
    const res = await fetch(`/api/catalog-search?${qs.toString()}`)
    const data = await res.json()
    setProducts(data.products || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [])

  useEffect(() => { void load(filters) }, [filters, load])
  useEffect(() => { if (filters.category) trackMarketplaceEvent("category_view", { query: filters.category }) }, [filters.category])

  function update(key: string, value: string) {
    const next = { ...filters }
    if (value) next[key] = value
    else delete next[key]
    setFilters(next)
    const qs = new URLSearchParams(next)
    router.replace(`/catalog${qs.size ? `?${qs.toString()}` : ""}`, { scroll: false })
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 border-b border-[#d0c6ac] pb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#725c00]">Direct from regional makers</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1a1c1c]">Marketplace catalog</h1>
        <p className="mt-2 text-sm text-[#4d4632]">{total} catalog items. Price on request means the source PDF did not state a price; stock requires seller confirmation.</p>
      </header>
      <div className="grid gap-7 lg:grid-cols-[230px_1fr]">
        <aside className="space-y-5 rounded-lg border border-[#d0c6ac] bg-white p-4">
          <label className="block text-xs font-semibold uppercase tracking-wider">State
            <select value={filters.state || ""} onChange={e => update("state", e.target.value)} className="mt-2 block w-full rounded border border-[#d0c6ac] bg-white px-2 py-2 text-sm font-normal normal-case tracking-normal text-[#4d4632]">
              <option value="">All states</option>{Object.entries(CATALOG_STATES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider">Seller
            <select value={filters.seller || ""} onChange={e => update("seller", e.target.value)} className="mt-2 block w-full rounded border border-[#d0c6ac] bg-white px-2 py-2 text-sm font-normal normal-case tracking-normal">
              <option value="">All sellers</option>{Object.values(CATALOG_SELLERS).map(name => <option key={name}>{name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider">Category
            <input value={filters.category || ""} onChange={e => update("category", e.target.value)} placeholder="e.g. Eri silk" className="mt-2 block w-full rounded border border-[#d0c6ac] px-2 py-2 text-sm font-normal normal-case tracking-normal" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider">Region
            <input value={filters.region || ""} onChange={e => update("region", e.target.value)} placeholder="e.g. Assam" className="mt-2 block w-full rounded border border-[#d0c6ac] px-2 py-2 text-sm font-normal normal-case tracking-normal" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider">Maximum price (₹)
            <input type="number" min="0" value={filters.maxPrice || ""} placeholder="Any price" onChange={e => update("maxPrice", e.target.value)} className="mt-2 block w-full rounded border border-[#d0c6ac] bg-white px-2 py-2 text-sm font-normal normal-case tracking-normal" />
          </label>
          <label className="flex items-center gap-2 text-sm text-[#4d4632]"><input type="checkbox" disabled /> Stock status not supplied</label>
        </aside>
        <section>
          <SponsoredSlot placement="search_top" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[#4d4632]">{loading ? "Updating results…" : `${total} results`}</p>
            <select aria-label="Sort catalog" value={filters.sort || "relevance"} onChange={e => update("sort", e.target.value === "relevance" ? "" : e.target.value)} className="rounded border border-[#d0c6ac] bg-white px-3 py-2 text-sm">
              <option value="relevance">Relevance</option><option value="title">Name</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {products.map(product => <article key={product.slug} className="overflow-hidden rounded-md border border-[#d0c6ac] bg-white transition-shadow hover:shadow-md">
              <Link href={`/catalog/${encodeURIComponent(product.slug)}`} onClick={() => trackMarketplaceEvent("product_click", { productSlug: product.slug, source: "catalog" })} className="block">
                <div className="relative aspect-[4/5] bg-white"><FallbackProductImage src={product.images?.[0]} alt={product.name} sizes="(max-width: 640px) 50vw, 25vw" className="object-contain p-2" /></div>
                <div className="px-3 pt-3"><p className="line-clamp-2 min-h-10 text-sm font-semibold text-[#1a1c1c]">{product.name}</p><p className="mt-2 text-sm font-bold">{product.price > 0 ? `₹${new Intl.NumberFormat("en-IN").format(product.price)}` : "Price on request"}</p><p className="mt-1 text-xs text-[#4d4632]">{CATALOG_SELLERS[product.seller_id] || "Catalog seller"}{PENDING_CATALOG_SELLER_IDS.has(product.seller_id) ? " · verification pending" : ""}</p><p className="mt-1 text-xs text-[#4d4632]">{product.specifications.craft_family} · {product.specifications.origin}</p></div>
              </Link>
              <div className="p-3 pt-2"><Link href={`/catalog/${encodeURIComponent(product.slug)}`} className="flex w-full items-center justify-center rounded border border-[#d0c6ac] px-3 py-2 text-xs font-semibold text-[#1a1c1c]">View product</Link>
                {isFurnitureProduct({ slug: product.slug, name: product.name }) && <CustomizationRequest product={{ slug: product.slug, name: product.name }} />}
              </div>
            </article>)}
          </div>
          {!loading && products.length === 0 && <div className="rounded-lg border border-dashed border-[#d0c6ac] p-8 text-center"><p className="text-sm font-semibold text-[#1a1c1c]">No catalog items match these filters yet.</p><p className="mt-1 text-xs text-[#4d4632]">Tell us what you hoped to find and help shape what we onboard next.</p><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("loqmart:request-demand", { detail: { query: filters.q || filters.category || "", source: "search" } }))} className="mt-4 rounded-md bg-[#fcd020] px-4 py-2.5 text-xs font-bold text-[#231b00]">Request this item</button></div>}
        </section>
      </div>
    </main>
  )
}
