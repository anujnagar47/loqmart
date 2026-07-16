import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const signature = request.headers.get("x-api-key")

    if (!signature || signature !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { awb, current_status, current_timestamp } = payload

    if (!awb || !current_status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Find the order with this AWB tracking number
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("tracking_number", awb)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found for AWB" }, { status: 404 })
    }

    // 2. Map Shiprocket status to LoqMart status
    let mappedStatus = "processing"
    const srStatus = current_status.toLowerCase()
    if (srStatus.includes("picked")) mappedStatus = "shipped"
    if (srStatus.includes("out for delivery")) mappedStatus = "out_for_delivery"
    if (srStatus.includes("delivered")) mappedStatus = "delivered"
    if (srStatus.includes("cancelled") || srStatus.includes("rto")) mappedStatus = "cancelled"

    // 3. Update Order Status
    await supabase
      .from("orders")
      .update({
        order_status: mappedStatus,
        updated_at: current_timestamp ? new Date(current_timestamp).toISOString() : new Date().toISOString(),
      })
      .eq("id", order.id)

    return NextResponse.json({ success: true, mappedStatus })
  } catch (error) {
    console.error("Shiprocket webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
