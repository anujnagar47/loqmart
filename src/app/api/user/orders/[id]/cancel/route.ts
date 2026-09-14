import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

const CANCELLABLE_ORDER_STATUSES = ["pending", "confirmed"]
const CANCELLABLE_PAYMENT_STATUSES = ["pending", "failed"]

// POST /api/user/orders/[id]/cancel — buyer-initiated cancellation, only
// before payment has actually been captured. Once payment_status is "paid"
// this route refuses — reversing captured money needs a real gateway refund
// integration, which doesn't exist yet; a paid order can instead go through
// the post-delivery Return/Refund request flow.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, order_status, payment_status, order_items(id, product_id, quantity)")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    if (
      !CANCELLABLE_ORDER_STATUSES.includes(order.order_status) ||
      !CANCELLABLE_PAYMENT_STATUSES.includes(order.payment_status)
    ) {
      return NextResponse.json(
        { error: "This order can no longer be cancelled. Use Return/Refund after delivery, or contact support." },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ order_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (updateError) {
      console.error("Order cancel error:", updateError)
      return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
    }

    // Restore stock reserved by this order.
    for (const item of order.order_items || []) {
      const { data: product } = await supabase
        .from("products")
        .select("stock, sold_count")
        .eq("id", item.product_id)
        .maybeSingle()
      if (product) {
        await supabase
          .from("products")
          .update({
            stock: product.stock + item.quantity,
            sold_count: Math.max(0, (product.sold_count || 0) - item.quantity),
          })
          .eq("id", item.product_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Order cancel API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
