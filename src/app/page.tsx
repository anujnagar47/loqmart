import { Hero } from "@/components/hero"
import { TrustBar } from "@/components/trust-bar"
import { CategoryGrid } from "@/components/category-grid"
import { FeaturedProducts } from "@/components/featured-products"
import { StateFeed } from "@/components/state-feed"
import { IndiaMap } from "@/components/map/IndiaMap"
import { SellerSpotlight } from "@/components/seller-spotlight"
import { EditorialSection } from "@/components/editorial-section"
import { BlogPreview } from "@/components/blog-preview"

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <CategoryGrid />
      <FeaturedProducts />
      <StateFeed />
      <IndiaMap />
      <SellerSpotlight />
      <EditorialSection />
      <BlogPreview />
    </>
  )
}
