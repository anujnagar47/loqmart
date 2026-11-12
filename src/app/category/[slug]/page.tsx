import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/admin"
import { fetchProductsList, parseProductListSearchParams } from "@/lib/products"
import { ProductListingClient } from "@/components/product-listing/ProductListingClient"
import { displayCategoryName } from "@/lib/craft-taxonomy"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function getCategory(slug: string) {
  const supabase = createServiceClient()
  const { data } = await supabase.from("categories").select("id, name, description").eq("slug", slug).maybeSingle()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return { title: "Category — LoqMart" }
  const categoryName = displayCategoryName({ name: category.name, slug })

  const description = category.description
    || `Explore ${categoryName} and regional craft from sellers across India on LoqMart.`

  return {
    title: `${categoryName} — LoqMart`,
    description,
    openGraph: { title: `${category.name} — LoqMart`, description, type: "website" },
  }
}

type SearchParams = Record<string, string | undefined>

export default async function CategorySlugPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<SearchParams>
}) {
  const { slug } = await params
  const sp = await searchParams
  const category = await getCategory(slug)
  if (!category) notFound()
  const categoryName = displayCategoryName({ name: category.name, slug })

  const listParams = parseProductListSearchParams(sp)
  listParams.category = category.id
  const result = await fetchProductsList(listParams)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Categories", item: `${BASE_URL}/category` },
      { "@type": "ListItem", position: 3, name: categoryName, item: `${BASE_URL}/category/${slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductListingClient
        key={JSON.stringify(sp)}
        title={categoryName}
        subtitle={category.description || undefined}
        anchorCategory={{ id: category.id, name: category.name }}
        initialProducts={result.products}
        initialTotal={result.total}
        initialError={Boolean(result.error)}
      />
    </>
  )
}
