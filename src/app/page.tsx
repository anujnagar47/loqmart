import { Hero } from "@/components/hero"
import { TrustBar } from "@/components/trust-bar"
import { CategoryGrid } from "@/components/category-grid"
import { HomeProductRow } from "@/components/home-product-row"
import { RecentlyViewedRow } from "@/components/recently-viewed-row"
import { StateFeed } from "@/components/state-feed"
import { BlogPreview } from "@/components/blog-preview"
import { fetchProductsList } from "@/lib/products"
import { CraftShowcase } from "@/components/craft-showcase"
import { IndiaMap } from "@/components/map/IndiaMap"
import { SponsoredSlot } from "@/components/sponsored-slot"

// Without this, Next.js bakes getHeroStats()'s result into the static HTML
// at build time and never refreshes it — real numbers that go stale the
// moment they're deployed are worse than an honest static placeholder.
export const revalidate = 3600 // 1 hour

export default async function HomePage() {
  const [bestSellers, highlights, newArrivals] = await Promise.all([
    fetchProductsList({ sort: "sold_desc", limit: 8 }),
    fetchProductsList({ sort: "rating_desc", limit: 8 }),
    fetchProductsList({ sort: "created_at_desc", limit: 8 }),
  ])


  return (
    <>
      <SponsoredSlot placement="home_hero" />
      <Hero />
      <TrustBar />
      <CategoryGrid />
      <CraftShowcase />
      <HomeProductRow
        preset="bestSellers"
        href="/best-sellers"
        products={bestSellers.products}
        badge="rank"
      />
      <HomeProductRow
        eyebrow="Selected Pieces"
        title="A closer look at regional craft"
        subtitle="Explore selected products from across India"
        href="/deals"
        hrefLabel="Explore highlights"
        products={highlights.products}
        tone="dark"
      />
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
      <BlogPreview />
    </>
  )
}
