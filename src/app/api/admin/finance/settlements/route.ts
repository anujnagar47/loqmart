import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { data } = await auth.db.from("settlements").select("*,sellers(business_name,state,state_code)").order("created_at", { ascending: false })
  return NextResponse.json({ settlements: data || [] })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const body = await req.json()
  const { seller_id, gross_amount, platform_fee, gateway_fee, net_payable, order_id, notes } = body
  if (!seller_id || !gross_amount) return NextResponse.json({ error: "seller_id and gross_amount required" }, { status: 400 })
  const { data, error } = await auth.db.from("settlements").insert({
    seller_id, gross_amount, platform_fee: platform_fee || 0, gateway_fee: gateway_fee || 0,
    net_payable: net_payable || gross_amount, order_id: order_id || null,
    status: "pending", processed_by: auth.userId,
  }).select().single()
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ settlement: data }, { status: 201 })
}
