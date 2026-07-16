import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: sellers, error } = await supabase
      .from("sellers")
      .select(`
        state_code,
        state,
        total_products,
        total_orders,
        swadeshi_rank,
        approval_status
      `)
      .eq("approval_status", "approved")

    if (error) {
      console.error("Error fetching sellers:", error)
      return NextResponse.json({ states: [] })
    }

    const stateStatsMap = new Map()

    sellers?.forEach((seller) => {
      const code = seller.state_code
      if (!code) return

      const existing = stateStatsMap.get(code) || {
        stateCode: code,
        stateName: seller.state || code,
        artisanCount: 0,
        productCount: 0,
      }

      stateStatsMap.set(code, {
        stateCode: code,
        stateName: seller.state || code,
        artisanCount: existing.artisanCount + 1,
        productCount: existing.productCount + (seller.total_products || 0),
      })
    })

    const states = Array.from(stateStatsMap.values()).map((stat: any) => ({
      stateCode: stat.stateCode,
      stateName: stat.stateName,
      artisanCount: stat.artisanCount,
      productCount: stat.productCount,
    }))

    states.sort((a, b) => b.productCount - a.productCount)

    return NextResponse.json({ states })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ states: [] })
  }
}
