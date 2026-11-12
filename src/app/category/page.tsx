import type { Metadata } from "next"
import { fetchProductsList, parseProductListSearchParams } from "@/lib/products"
import { ProductListingClient } from "@/components/product-listing/ProductListingClient"

export const metadata: Metadata = {
  title: "Indian Crafts, Handlooms & Regional Goods | LoqMart",
  description: "Explore regional Indian crafts, heritage textiles, artisan pottery, fine art, metalwork and origin-led foods.",
}

type SearchParams = Record<string, string | undefined>

export default async function CategoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const params = parseProductListSearchParams(sp)
  const result = await fetchProductsList(params)

  const eyebrow = params.mode === "handmade" ? "Artisan Crafts" : params.mode === "machine_made" ? "Contemporary Craft" : "Regional Craft & Heritage"
  const title = sp.search
    ? `Search: "${sp.search}"`
    : params.mode === "handmade" ? "Handcrafted Collection" : params.mode === "machine_made" ? "Contemporary Crafted Collection" : "Explore Indian Crafts"

  return (
    <ProductListingClient
      key={JSON.stringify(sp)}
      title={title}
      eyebrow={eyebrow}
      initialProducts={result.products}
      initialTotal={result.total}
      initialError={Boolean(result.error)}
    />
  )
}
