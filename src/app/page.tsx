import { Hero } from "@/components/hero"
import { TrustBar } from "@/components/trust-bar"
import { CategoryGrid } from "@/components/category-grid"
import { HomeProductRow } from "@/components/home-product-row"
import { RecentlyViewedRow } from "@/components/recently-viewed-row"
import { StateFeed } from "@/components/state-feed"
import { SellerSpotlight } from "@/components/seller-spotlight"
import { BlogPreview } from "@/components/blog-preview"
import { fetchProductsList } from "@/lib/products"
import { CraftShowcase } from "@/components/craft-showcase"

const STATE_NAMES: Record<string, string> = {
  RJ: "Rajasthan", UP: "Uttar Pradesh", MH: "Maharashtra", WB: "West Bengal",
  KA: "Karnataka", TN: "Tamil Nadu", OR: "Odisha", OD: "Odisha", AP: "Andhra Pradesh",
  GJ: "Gujarat", KL: "Kerala", DL: "Delhi", PB: "Punjab", HR: "Haryana",
  MP: "Madhya Pradesh", BR: "Bihar", JK: "Jammu & Kashmir", AS: "Assam", JH: "Jharkhand",
  CT: "Chhattisgarh", HP: "Himachal Pradesh", UK: "Uttarakhand", TG: "Telangana",
  GA: "Goa", MN: "Manipur", TR: "Tripura", ML: "Meghalaya", MZ: "Mizoram",
  NL: "Nagaland", SK: "Sikkim", AR: "Arunachal Pradesh", LA: "Ladakh",
}

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
  const heroStateSlides = Array.from(
    new Map(
      [...bestSellers.products, ...highlights.products, ...newArrivals.products]
        .filter((product) => product.state_code && product.images?.[0])
        .map((product) => [product.state_code!, {
          stateCode: product.state_code!,
          stateName: STATE_NAMES[product.state_code!] || product.state_code!,
          image: product.images[0],
        }])
    ).values()
  ).slice(0, 7)

  return (
    <>
      <Hero stateSlides={heroStateSlides} />
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
        subtitle="Explore pieces selected from seller communities across India"
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
      <SellerSpotlight />
      <StateFeed />
      <BlogPreview />
    </>
  )
}
