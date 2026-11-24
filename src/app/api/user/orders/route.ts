import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const sessionClient = await createClient()
  const { data: { user }, error: authError } = await sessionClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("id")
  const orderIds = (searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 10)

  const db = createServiceClient()
  let query = db
    .from("orders")
    .select(`
      id, order_number, total, subtotal, shipping_cost, tax, discount_amount,
      coins_used, coins_discount,
      payment_status, order_status, reservation_status, created_at, tracking_number, shipping_address,
      confirmed_at, shipped_at, delivered_at,
      razorpay_order_id,
      order_items(
        id, quantity, price, total,
        product:products(id, name, images, slug)
      )
    `)
    .eq("user_id", user.id)

  // A caller can only ever fetch their own order — the id is just narrowing
  // the already user_id-scoped query, never a substitute for ownership.
  query = orderId ? query.eq("id", orderId) : orderIds.length ? query.in("id", orderIds) : query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("User orders fetch error:", error)
    return NextResponse.json({ orders: [] })
  }

  if (orderId) {
    return NextResponse.json({ order: data?.[0] || null })
  }
  if (orderIds.length) return NextResponse.json({ orders: data || [] })
  return NextResponse.json({ orders: data || [] })
}
