import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"
import crypto from "crypto"
import { createShiprocketOrder, generateAWB, schedulePickup } from "@/lib/shiprocket"

// POST /api/orders/webhook/razorpay - Razorpay payment webhook
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || ""

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex")

    if (signature !== expectedSignature) {
      console.error("Invalid Razorpay webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    const supabase = createServiceClient()

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity
      const orderId = payment.notes?.order_id

      if (!orderId) {
        return NextResponse.json({ error: "Order ID not found in payment" }, { status: 400 })
      }

      // Update order status
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "confirmed",
          payment_id: payment.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select("*, users(id)")
        .single()

      if (orderError || !order) {
        console.error("Order update error:", orderError)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // Record payment
      await supabase.from("payments").insert({
        order_id: orderId,
        amount: payment.amount / 100, // Razorpay sends in paise
        currency: payment.currency,
        payment_status: "paid",
        payment_method: payment.method,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        razorpay_signature: signature,
        metadata: { event: event.event, payload: payment },
      })

      // Award LoqCoins to buyer
      const coinsEarned = Math.floor(order.subtotal / 100)
      if (coinsEarned > 0) {
        const { data: balance } = await supabase
          .from("loqcoin_balances")
          .select("balance, lifetime_earned")
          .eq("user_id", order.user_id)
          .single()

        if (balance) {
          const newBalance = balance.balance + coinsEarned
          await supabase
            .from("loqcoin_balances")
            .update({
              balance: newBalance,
              lifetime_earned: balance.lifetime_earned + coinsEarned,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", order.user_id)

          // Log ledger entry
          await supabase.from("loqcoin_ledger").insert({
            user_id: order.user_id,
            transaction_type: "earn",
            amount: coinsEarned,
            balance_after: newBalance,
            source: "purchase",
            reference_id: orderId,
            reference_type: "order",
            description: `LoqCoins earned on Order #${order.order_number}`,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }
      }

      // Send notification to buyer
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        type: "order_confirmed",
        title: "Order Confirmed!",
        message: `Your order #${order.order_number} is confirmed. ${coinsEarned} LoqCoins will be credited on delivery.`,
        data: { order_id: orderId, order_number: order.order_number },
      })

      // Trigger Shiprocket shipment creation if credentials are configured
      if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
        try {
          const { data: fullOrder } = await supabase
            .from("orders")
            .select(`
              order_number, total, subtotal,
              addresses(name, phone, address_line1, city, state, pincode),
              order_items(quantity, price, products(name))
            `)
            .eq("id", orderId)
            .single()

          if (fullOrder) {
            const addr = (fullOrder as any).addresses
            const items = (fullOrder as any).order_items || []
            const srPayload = {
              order_id: (fullOrder as any).order_number,
              order_date: new Date().toISOString().split("T")[0],
              pickup_location: "Primary",
              billing_customer_name: addr?.name || "Customer",
              billing_phone: addr?.phone || "9999999999",
              billing_address: addr?.address_line1 || "India",
              billing_city: addr?.city || "Delhi",
              billing_state: addr?.state || "Delhi",
              billing_country: "India",
              billing_pincode: addr?.pincode || "110001",
              shipping_is_billing: true,
              order_items: items.map((item: any) => ({
                name: item.products?.name || "Product",
                sku: item.products?.name?.toLowerCase().replace(/\s+/g, "-") || "sku",
                units: item.quantity,
                selling_price: item.price,
              })),
              payment_method: "Prepaid" as const,
              sub_total: (fullOrder as any).subtotal,
              length: 15,
              breadth: 10,
              height: 8,
              weight: 0.5,
            }

            const srOrder = await createShiprocketOrder(srPayload)
            if (srOrder?.shipment_id) {
              const awbRes = await generateAWB(srOrder.shipment_id)
              const trackingNumber = awbRes?.response?.data?.awb_code || null
              await supabase
                .from("orders")
                .update({ tracking_number: trackingNumber })
                .eq("id", orderId)
              await schedulePickup([srOrder.shipment_id])
            }
          }
        } catch (srErr) {
          console.error("Shiprocket shipment creation failed (non-fatal):", srErr)
        }
      }

      console.log(`Order ${orderId} confirmed, ${coinsEarned} LoqCoins queued for buyer`)
      return NextResponse.json({ success: true, order_id: orderId })
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity
      const orderId = payment.notes?.order_id

      if (orderId) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", orderId)
      }

      return NextResponse.json({ success: true, event: "payment.failed" })
    }

    // Acknowledge other events
    return NextResponse.json({ success: true, event: event.event })
  } catch (error) {
    console.error("Razorpay webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
