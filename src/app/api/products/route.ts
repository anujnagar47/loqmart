import { NextResponse } from "next/server"
import { fetchProductsList } from "@/lib/products"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawSearch = searchParams.get("q")
    const state = searchParams.get("state")

    const craftType = searchParams.get("craft_type")
    const result = await fetchProductsList({
      mode: craftType === "handcrafted" ? "handmade" : craftType === "contemporary" ? "machine_made" : searchParams.get("mode"),
      giCertified: searchParams.get("gi_certified") === "1",
      handloom: searchParams.get("handloom") === "1",
      cluster: searchParams.get("cluster"),
      category: searchParams.get("category"),
      state: state ? state.toUpperCase() : null,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null,
      rating: searchParams.get("rating") ? Number(searchParams.get("rating")) : null,
      discount: searchParams.get("discount") ? Number(searchParams.get("discount")) : null,
      inStock: searchParams.get("inStock") === "1" || searchParams.get("inStock") === "true",
      seller: searchParams.get("seller"),
      sort: searchParams.get("sort") || "created_at_desc",
      q: rawSearch ? rawSearch.slice(0, 100) : null,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 24,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 503, headers: { "Cache-Control": "no-store" } })
    }

    return NextResponse.json(
      result,
      // Public, read-only listing hit on nearly every page load — let a CDN
      // cache each distinct filter/sort/page combination for a short window
      // and serve stale while revalidating, rather than hitting the DB on
      // every single request.
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    )
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
