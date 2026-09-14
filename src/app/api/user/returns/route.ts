import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

const VALID_REASONS = ["damaged", "wrong_product", "not_as_described", "quality_issue", "other"]

// POST /api/user/returns — buyer-initiated return/refund request
export async function POST(request: Request) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { order_id, order_item_id, reason, description } = body

    if (!order_id || !order_item_id) {
      return NextResponse.json({ error: "Order and item are required" }, { status: 400 })
    }
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: "A valid reason is required" }, { status: 400 })
    }
    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json({ error: "Please describe the issue in more detail (at least 10 characters)" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify the order belongs to the caller and is actually delivered.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, order_status")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    if (order.order_status !== "delivered") {
      return NextResponse.json({ error: "Returns can only be requested for delivered orders" }, { status: 400 })
    }

    // Verify the item belongs to this order, and get its seller.
    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .select("id, order_id, seller_id")
      .eq("id", order_item_id)
      .eq("order_id", order_id)
      .maybeSingle()

    if (itemError || !orderItem) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 })
    }

    // Prevent duplicate open requests for the same item.
    const { data: existing } = await supabase
      .from("return_requests")
      .select("id")
      .eq("order_item_id", order_item_id)
      .not("status", "in", "(closed,resolved_buyer,resolved_seller)")
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "A return request for this item is already in progress" }, { status: 409 })
    }

    const { data: returnRequest, error: insertError } = await supabase
      .from("return_requests")
      .insert({
        order_id,
        order_item_id,
        buyer_id: user.id,
        seller_id: orderItem.seller_id,
        reason,
        description: description.trim(),
        status: "pending",
      })
      .select()
      .single()

    if (insertError || !returnRequest) {
      console.error("Return request insert error:", insertError)
      return NextResponse.json({ error: "Failed to submit return request" }, { status: 500 })
    }

    return NextResponse.json({ success: true, return_request: returnRequest }, { status: 201 })
  } catch (error) {
    console.error("Return request API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
