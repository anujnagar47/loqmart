import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    // Categories change rarely (admin CRUD only) — safe to cache longer
    // than the products listing.
    return NextResponse.json(
      { categories: data || [] },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } }
    )
  } catch (error) {
    console.error("Categories API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
