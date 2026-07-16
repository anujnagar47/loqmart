import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET() {
  const sessionClient = await createClient()
  const { data: { user }, error: authError } = await sessionClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from("orders")
    .select(`
      id, order_number, total, subtotal, shipping_cost, tax, discount_amount,
      payment_status, order_status, created_at, tracking_number, shipping_address,
      razorpay_order_id,
      order_items(
        id, quantity, price, total,
        product:products(id, name, images, slug)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("User orders fetch error:", error)
    return NextResponse.json({ orders: [] })
  }

  return NextResponse.json({ orders: data || [] })
}
