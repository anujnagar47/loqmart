import type { Metadata } from "next"
import { fetchProductsList, parseProductListSearchParams } from "@/lib/products"
import { ProductListingClient } from "@/components/product-listing/ProductListingClient"

export const metadata: Metadata = {
  title: "Shop Handmade & Machine-Made Products | LoqMart",
  description: "Browse verified handmade crafts and machine-made products from Indian sellers, filterable by state, price, rating, discount and category.",
}

type SearchParams = Record<string, string | undefined>

export default async function CategoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const params = parseProductListSearchParams(sp)
  const result = await fetchProductsList(params)

  const eyebrow = params.mode === "handmade" ? "Artisan Crafts" : params.mode === "machine_made" ? "Industrial Quality" : "Full Catalogue"
  const title = sp.search
    ? `Search: "${sp.search}"`
    : params.mode === "handmade" ? "Handmade Collection" : params.mode === "machine_made" ? "Machine-Made Collection" : "All Products"

  return (
    <ProductListingClient
      key={JSON.stringify(sp)}
      title={title}
      eyebrow={eyebrow}
      initialProducts={result.products}
      initialTotal={result.total}
    />
  )
}
