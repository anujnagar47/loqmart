import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("sellers")
      .select("id, business_name, owner_name, state_code, city, address, logo_url, banner_url, swadeshi_rank, swadeshi_score, total_products, total_orders")
      .eq("approval_status", "approved")
      .order("swadeshi_score", { ascending: false })
      .order("total_orders", { ascending: false })
      .limit(4)

    if (error) {
      console.error("Featured sellers query failed:", error)
      return NextResponse.json({ error: "Seller profiles are temporarily unavailable" }, { status: 503 })
    }

    return NextResponse.json(
      { sellers: data || [] },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    )
  } catch (error) {
    console.error("Featured sellers request failed:", error)
    return NextResponse.json({ error: "Seller profiles are temporarily unavailable" }, { status: 503 })
  }
}
