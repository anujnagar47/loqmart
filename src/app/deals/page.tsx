import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { fetchProductsList, parseProductListSearchParams } from "@/lib/products"
import { ProductListingClient } from "@/components/product-listing/ProductListingClient"

export const metadata: Metadata = {
  title: "Deals & Offers — LoqMart",
  description: "Real discounts on verified handmade and machine-made products from Indian sellers — no fabricated countdowns, just products actually marked down from their listed MRP.",
}

const MIN_DISCOUNT = 10

type SearchParams = Record<string, string | undefined>

export default async function DealsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams

  // Default to sorting by biggest discount first — but keep that in the URL
  // (rather than baked into the fetch only) so it round-trips like any
  // other explicit filter/sort choice.
  if (!sp.sort) {
    const params = new URLSearchParams(sp as Record<string, string>)
    params.set("sort", "discount_desc")
    redirect(`/deals?${params.toString()}`)
  }

  const listParams = parseProductListSearchParams(sp)
  listParams.discount = MIN_DISCOUNT
  const result = await fetchProductsList(listParams)

  return (
    <ProductListingClient
      key={JSON.stringify(sp)}
      title="Deals & Offers"
      eyebrow="Real Discounts"
      subtitle={`Products at least ${MIN_DISCOUNT}% off their listed MRP`}
      anchorMinDiscount={MIN_DISCOUNT}
      initialProducts={result.products}
      initialTotal={result.total}
    />
  )
}
