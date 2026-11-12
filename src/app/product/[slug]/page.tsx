import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/admin"
import { ProductPageClient } from "./ProductPageClient"

async function getProduct(slug: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("products")
    .select("name, description, images, stock, rating, review_count, sellers(business_name)")
    .eq("slug", slug)
    .eq("approval_status", "approved")
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: "Product Not Found — LoqMart" }

  const sellerName = (product as unknown as { sellers: { business_name: string } | null }).sellers?.business_name
  const description = product.description
    ? product.description.slice(0, 155)
    : `Explore ${product.name}${sellerName ? ` from ${sellerName}` : ""} on LoqMart — India's regional craft marketplace.`

  return {
    title: `${product.name} — LoqMart`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images?.[0] ? [product.images[0]] : undefined,
      type: "website",
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images || undefined,
    brand: (product as unknown as { sellers: { business_name: string } | null }).sellers?.business_name
      ? { "@type": "Brand", name: (product as unknown as { sellers: { business_name: string } | null }).sellers?.business_name }
      : undefined,
    ...(product.rating > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.review_count || 1,
      },
    } : {}),
  } : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ProductPageClient />
    </>
  )
}
