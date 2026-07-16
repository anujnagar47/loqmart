import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createServiceClient()

    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        sellers(
          id, business_name, owner_name, description, logo_url,
          state_code, city, gstin, swadeshi_rank, swadeshi_score,
          total_orders, total_products, approval_status, created_at
        ),
        categories(id, name, slug, description)
      `)
      .eq("slug", slug)
      .eq("approval_status", "approved")
      .single()

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Fetch reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select("*, users(full_name)")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .limit(20)

    // Fetch related products (same category, same state, approved)
    const { data: related } = await supabase
      .from("products")
      .select("id, name, slug, price, mrp, images, mode, state_code, rating, review_count, sold_count, tags")
      .eq("approval_status", "approved")
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .limit(8)

    // Fetch more from same state (only if state_code is set)
    const sameStateQuery = product.state_code
      ? await supabase
          .from("products")
          .select("id, name, slug, price, mrp, images, mode, state_code, rating, review_count, sold_count, tags")
          .eq("approval_status", "approved")
          .eq("state_code", product.state_code)
          .neq("id", product.id)
          .limit(6)
      : { data: [] }
    const { data: sameState } = sameStateQuery

    return NextResponse.json({
      product,
      reviews: reviews || [],
      relatedProducts: related || [],
      sameStateProducts: sameState || [],
    })
  } catch (error) {
    console.error("Product detail API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
