import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  if (auth.role === "sub_admin" && !auth.stateScope) return NextResponse.json({ error: "A state scope is required for sub-admin order access." }, { status: 403 })
  const { orderId } = await params
  const scoped = auth.role === "sub_admin" && auth.stateScope
  const sellerJoin = scoped ? "sellers!orders_seller_id_fkey!inner(business_name, owner_name, state_code)" : "sellers!orders_seller_id_fkey(business_name, owner_name, state_code)"
  const { data, error } = await auth.db
    .from("orders")
    .select(`id, order_number, total, subtotal, shipping_cost, discount_amount, tax, payment_status, order_status, reservation_status, created_at, confirmed_at, payment_id, notes, tracking_number, shipping_address, users!orders_user_id_fkey(email, full_name, phone), ${sellerJoin}, addresses!orders_address_id_fkey(name, phone, address_line1, address_line2, city, state, pincode), order_items(id, quantity, price, total, variant_id, variant_name, seller_id, products(name, images, price, mode, state_code))`)
    .eq("id", orderId)
    .maybeSingle()
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  const scopedSeller = Array.isArray(data?.sellers) ? data.sellers[0] : data?.sellers
  if (!data || (scoped && scopedSeller?.state_code !== auth.stateScope)) return NextResponse.json({ error: "Order not found in your permitted scope." }, { status: 404 })
  return NextResponse.json({ order: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  if (auth.role === "sub_admin" && !auth.stateScope) return NextResponse.json({ error: "A state scope is required for sub-admin order access." }, { status: 403 })
  const { orderId } = await params
  const body = await req.json()
  const update: Record<string, unknown> = {}
  const orderStatuses = ["pending", "processing", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"]
  const paymentStatuses = ["pending", "paid", "failed", "refunded"]
  if (body.order_status && orderStatuses.includes(body.order_status)) update.order_status = body.order_status
  if (body.payment_status && paymentStatuses.includes(body.payment_status)) update.payment_status = body.payment_status
  if (body.reservation_status && ["pending_confirmation", "confirmed", "cancelled"].includes(body.reservation_status)) update.reservation_status = body.reservation_status
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No valid order status update provided." }, { status: 400 })
  if (auth.role === "sub_admin" && auth.stateScope) {
    const { data: order } = await auth.db.from("orders").select("seller_id, sellers!orders_seller_id_fkey(state_code)").eq("id", orderId).maybeSingle()
    const orderSeller = Array.isArray(order?.sellers) ? order.sellers[0] : order?.sellers
    if (!order || orderSeller?.state_code !== auth.stateScope) return NextResponse.json({ error: "Order not found in your permitted scope." }, { status: 404 })
  }
  if (body.order_status === "cancelled" || body.reservation_status === "cancelled") {
    const { data: order } = await auth.db.from("orders").select("id, user_id, reservation_status").eq("id", orderId).maybeSingle()
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 })
    if (order.reservation_status !== "cancelled") {
      const { data: cancelled, error: cancelError } = await auth.db.rpc("cancel_unpaid_order_and_release_inventory", { p_order_id: orderId, p_buyer_id: order.user_id })
      if (cancelError || !cancelled) return NextResponse.json({ error: "Could not cancel this reservation or release its inventory." }, { status: 409 })
    }
    update.reservation_status = "cancelled"
    update.order_status = "cancelled"
  }
  const { error } = await auth.db.from("orders").update(update).eq("id", orderId)
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
