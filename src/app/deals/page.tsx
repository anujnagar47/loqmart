import type { Metadata } from "next"
import { fetchProductsList, parseProductListSearchParams } from "@/lib/products"
import { ProductListingClient } from "@/components/product-listing/ProductListingClient"

export const metadata: Metadata = {
  title: "Curated Craft Highlights — LoqMart",
  description: "Discover a changing selection of regional crafts and products from sellers across India.",
}

type SearchParams = Record<string, string | undefined>

export default async function DealsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams

  const listParams = parseProductListSearchParams(sp)
  listParams.discount = null
  listParams.sort = sp.sort || "rating_desc"
  const result = await fetchProductsList(listParams)

  return (
    <ProductListingClient
      key={JSON.stringify(sp)}
      title="Curated Craft Highlights"
      eyebrow="From across India"
      subtitle="A considered selection of pieces from regional makers and seller communities"
      initialProducts={result.products}
      initialTotal={result.total}
      initialError={Boolean(result.error)}
    />
  )
}
