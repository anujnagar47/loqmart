import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  // A sub_admin with a state_scope only sees orders whose seller is in that
  // state — the sellers join has to be !inner for PostgREST to accept a
  // filter on the embedded resource's column.
  const scoped = auth.role === "sub_admin" && auth.stateScope
  const sellerSelect = scoped ? "sellers!orders_seller_id_fkey!inner(business_name, state_code)" : "sellers!orders_seller_id_fkey(business_name)"

  let query = auth.db
    .from("orders")
    .select(`id, order_number, total, payment_status, order_status, created_at, users!orders_user_id_fkey(email), ${sellerSelect}`)
    .order("created_at", { ascending: false })
    .limit(500)

  if (scoped) query = query.eq("sellers.state_code", auth.stateScope)

  const { data, error } = await query
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ orders: data || [] })
}
