import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "24")
    const mode = searchParams.get("mode") // handmade | machine_made
    const category = searchParams.get("category")
    const state = searchParams.get("state")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sort = searchParams.get("sort") || "created_at_desc"
    const rawSearch = searchParams.get("q")
    const search = rawSearch ? rawSearch.slice(0, 100) : null // cap at 100 chars

    const supabase = createServiceClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from("products")
      .select("*, sellers(id, business_name, swadeshi_rank, state_code), categories(id, name, slug)", { count: "exact" })
      .eq("approval_status", "approved")

    if (mode) query = query.eq("mode", mode)
    if (category) query = query.eq("category_id", category)
    if (state) query = query.eq("state_code", state.toUpperCase())
    if (minPrice) query = query.gte("price", parseInt(minPrice))
    if (maxPrice) query = query.lte("price", parseInt(maxPrice))
    if (search) query = query.ilike("name", `%${search}%`)

    // Sorting
    switch (sort) {
      case "price_asc": query = query.order("price", { ascending: true }); break
      case "price_desc": query = query.order("price", { ascending: false }); break
      case "rating_desc": query = query.order("rating", { ascending: false }); break
      case "sold_desc": query = query.order("sold_count", { ascending: false }); break
      default: query = query.order("created_at", { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Products fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    return NextResponse.json({
      products: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
