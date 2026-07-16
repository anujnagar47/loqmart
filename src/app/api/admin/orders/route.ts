import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { data, error } = await auth.db
    .from("orders")
    .select("id, order_number, total, payment_status, order_status, created_at, users!orders_user_id_fkey(email), sellers!orders_seller_id_fkey(business_name)")
    .order("created_at", { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data || [] })
}
