import { Hero } from "@/components/hero"
import { TrustBar } from "@/components/trust-bar"
import { CategoryGrid } from "@/components/category-grid"
import { FeaturedProducts } from "@/components/featured-products"
import { HomeProductRow } from "@/components/home-product-row"
import { RecentlyViewedRow } from "@/components/recently-viewed-row"
import { StateFeed } from "@/components/state-feed"
import { IndiaMap } from "@/components/map/IndiaMap"
import { SellerSpotlight } from "@/components/seller-spotlight"
import { EditorialSection } from "@/components/editorial-section"
import { BlogPreview } from "@/components/blog-preview"
import { createServiceClient } from "@/lib/supabase/admin"
import { fetchProductsList } from "@/lib/products"

// Without this, Next.js bakes getHeroStats()'s result into the static HTML
// at build time and never refreshes it — real numbers that go stale the
// moment they're deployed are worse than an honest static placeholder.
export const revalidate = 3600 // 1 hour

async function getHeroStats() {
  const supabase = createServiceClient()
  const [products, sellers, categories] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("approval_status", "approved"),
    supabase.from("sellers").select("id", { count: "exact", head: true }).eq("approval_status", "approved"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ])
  return {
    products: products.count || 0,
    sellers: sellers.count || 0,
    categories: categories.count || 0,
    states: 36, // India's real count of states + union territories — a constant, not fabricated data
  }
}

export default async function HomePage() {
  const [stats, bestSellers, deals, newArrivals] = await Promise.all([
    getHeroStats(),
    fetchProductsList({ sort: "sold_desc", limit: 8 }),
    fetchProductsList({ discount: 10, sort: "discount_desc", limit: 8 }),
    fetchProductsList({ sort: "created_at_desc", limit: 8 }),
  ])

  return (
    <>
      <Hero stats={stats} />
      <TrustBar />
      <HomeProductRow
        preset="bestSellers"
        href="/best-sellers"
        products={bestSellers.products}
        badge="rank"
      />
      <HomeProductRow
        preset="deals"
        href="/deals?sort=discount_desc"
        products={deals.products}
        tone="dark"
      />
      <CategoryGrid />
      <FeaturedProducts />
      <HomeProductRow
        preset="newArrivals"
        href="/new"
        products={newArrivals.products}
        tone="dark"
        badge="new"
      />
      <RecentlyViewedRow />
      <StateFeed />
      <IndiaMap />
      <SellerSpotlight />
      <EditorialSection />
      <BlogPreview />
    </>
  )
}
