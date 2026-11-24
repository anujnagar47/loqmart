import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { INDIA_STATE_DATA } from "@/lib/indiaStateData"

const STATE_ALIASES: Record<string, string> = { OR: "OD", CG: "CT", UK: "UA", TS: "TG", DN: "DN", DD: "DN" }
const canonicalCode = (code: string) => STATE_ALIASES[code.toUpperCase()] || code.toUpperCase()

export async function GET() {
  try {
    const supabase = createServiceClient()
    const [{ data: sellers, error: sellerError }, { data: products, error: productError }] = await Promise.all([
      supabase.from("sellers").select("state_code").eq("approval_status", "approved"),
      supabase.from("products").select("state_code").eq("approval_status", "approved").not("state_code", "is", null),
    ])
    if (sellerError || productError) return NextResponse.json({ states: [] })

    const counts = new Map<string, { artisanCount: number; productCount: number }>()
    const ensure = (rawCode: string) => {
      const code = canonicalCode(rawCode)
      const current = counts.get(code) || { artisanCount: 0, productCount: 0 }
      counts.set(code, current)
      return current
    }
    for (const seller of sellers || []) if (seller.state_code) ensure(seller.state_code).artisanCount++
    for (const product of products || []) if (product.state_code) ensure(product.state_code).productCount++

    const states = [...counts.entries()].map(([stateCode, count]) => ({
      stateCode,
      stateName: INDIA_STATE_DATA.find(state => state.filterCodes.some(code => canonicalCode(code) === stateCode))?.name || stateCode,
      ...count,
    })).sort((a, b) => b.productCount - a.productCount)
    return NextResponse.json({ states })
  } catch (error) {
    console.error("State stats error:", error)
    return NextResponse.json({ states: [] })
  }
}
