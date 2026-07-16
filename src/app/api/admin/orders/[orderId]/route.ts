import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { orderId } = await params
  const { data, error } = await auth.db
    .from("orders")
    .select(`
      id, order_number, total, subtotal, shipping_cost, discount_amount, tax,
      payment_status, order_status, created_at, confirmed_at, payment_id,
      notes, razorpay_order_id, tracking_number, shipping_address,
      users!orders_user_id_fkey(email, full_name, phone),
      sellers!orders_seller_id_fkey(business_name, owner_name),
      addresses!orders_address_id_fkey(name, phone, address_line1, address_line2, city, state, pincode),
      order_items(
        id, quantity, price, total,
        products(name, images, price, mode, state_code)
      )
    `)
    .eq("id", orderId)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ order: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { orderId } = await params
  const body = await req.json()
  const update: Record<string, unknown> = {}
  if (body.order_status)   update.order_status   = body.order_status
  if (body.payment_status) update.payment_status = body.payment_status
  const { error } = await auth.db.from("orders").update(update).eq("id", orderId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
