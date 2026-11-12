import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"
import crypto from "crypto"
import { createShiprocketOrder, generateAWB, schedulePickup } from "@/lib/shiprocket"

// POST /api/orders/webhook/razorpay - Razorpay payment webhook
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured — refusing to process webhook")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    // Verify Razorpay signature (constant-time compare — signature is attacker-influenced input)
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex")

    const signatureValid =
      !!signature &&
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))

    if (!signatureValid) {
      console.error("Invalid Razorpay webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    const supabase = createServiceClient()

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity
      const orderId = payment.notes?.order_id
      const orderNumber = payment.notes?.order_number

      if (!orderId && !orderNumber) {
        return NextResponse.json({ error: "Order ID not found in payment" }, { status: 400 })
      }

      // Update order status
      let orderQuery = supabase
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "confirmed",
          payment_id: payment.id,
          confirmed_at: new Date().toISOString(),
        })
      orderQuery = orderId
        ? orderQuery.eq("id", orderId)
        : orderQuery.eq("order_number", orderNumber)
      const { data: order, error: orderError } = await orderQuery
        .neq("order_status", "cancelled")
        .in("payment_status", ["pending", "failed"])
        .select("*, users(id)")
        .maybeSingle()

      if (orderError) {
        console.error("Order update error:", orderError)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      if (!order) {
        let existingQuery = supabase.from("orders").select("id, order_number, user_id, order_status, payment_status")
        existingQuery = orderId
          ? existingQuery.eq("id", orderId)
          : existingQuery.eq("order_number", orderNumber)
        const { data: existingOrder } = await existingQuery.maybeSingle()

        // Razorpay can retry a webhook; an already-paid order must not be
        // awarded coins or recorded a second time.
        if (existingOrder?.payment_status === "paid") {
          return NextResponse.json({ success: true, order_id: existingOrder.id, duplicate: true })
        }

        // A payment can finish just as a buyer cancels. Keep the cancellation
        // and released stock intact, record the capture, and alert the buyer
        // that support must arrange the refund manually.
        if (existingOrder?.order_status === "cancelled") {
          await supabase.from("orders").update({
            payment_status: "paid",
            payment_id: payment.id,
            updated_at: new Date().toISOString(),
          }).eq("id", existingOrder.id)
          await supabase.from("payments").insert({
            order_id: existingOrder.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            payment_status: "paid",
            payment_method: payment.method,
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            razorpay_signature: signature,
            metadata: { event: event.event, payload: payment, refund_required: true },
          })
          await supabase.from("notifications").insert({
            user_id: existingOrder.user_id,
            type: "payment_refund_required",
            title: "Payment received for a cancelled order",
            message: `Payment for cancelled order #${existingOrder.order_number} was captured. Contact support to arrange a refund.`,
            data: { order_id: existingOrder.id, order_number: existingOrder.order_number },
          })
          return NextResponse.json({ success: true, order_id: existingOrder.id, refund_required: true })
        }

        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      const resolvedOrderId = order.id

      // A promo is consumed only after the payment provider confirms capture.
      if (order.coupon_code) {
        await supabase
          .from("survey_discount_codes")
          .update({
            is_used: true,
            used_at: new Date().toISOString(),
            used_by_order_id: resolvedOrderId,
          })
          .eq("code", order.coupon_code)
          .eq("is_used", false)
      }

      // Record payment
      await supabase.from("payments").insert({
        order_id: resolvedOrderId,
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
            reference_id: resolvedOrderId,
            reference_type: "order",
            description: `LoqCoins earned on Order #${order.order_number}`,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }
      }

      // Spend any LoqCoins reserved at checkout — deferred to here (rather than
      // /api/checkout) so a failed/abandoned Razorpay payment never actually
      // debits the buyer's wallet.
      const coinsUsed = order.coins_used || 0
      if (coinsUsed > 0) {
        const { data: redeemBalance } = await supabase
          .from("loqcoin_balances")
          .select("balance, lifetime_redeemed")
          .eq("user_id", order.user_id)
          .single()

        if (redeemBalance) {
          const newRedeemBalance = redeemBalance.balance - coinsUsed
          await supabase
            .from("loqcoin_balances")
            .update({
              balance: newRedeemBalance,
              lifetime_redeemed: (redeemBalance.lifetime_redeemed || 0) + coinsUsed,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", order.user_id)

          await supabase.from("loqcoin_ledger").insert({
            user_id: order.user_id,
            transaction_type: "redeem",
            amount: -coinsUsed,
            balance_after: newRedeemBalance,
            source: "checkout",
            reference_id: resolvedOrderId,
            reference_type: "order",
            description: `LoqCoins redeemed on Order #${order.order_number}`,
          })
        }
      }

      // Send notification to buyer
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        type: "order_confirmed",
        title: "Order Confirmed!",
        message: `Your order #${order.order_number} is confirmed. ${coinsEarned} LoqCoins will be credited on delivery.`,
        data: { order_id: resolvedOrderId, order_number: order.order_number },
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
            .eq("id", resolvedOrderId)
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
                .eq("id", resolvedOrderId)
              await schedulePickup([srOrder.shipment_id])
            }
          }
        } catch (srErr) {
          console.error("Shiprocket shipment creation failed (non-fatal):", srErr)
        }
      }

      console.log(`Order ${resolvedOrderId} confirmed, ${coinsEarned} LoqCoins queued for buyer`)
      return NextResponse.json({ success: true, order_id: resolvedOrderId })
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity
      const orderId = payment.notes?.order_id
      const orderNumber = payment.notes?.order_number

      if (orderId) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", orderId)
          .in("payment_status", ["pending", "failed"])
      } else if (orderNumber) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("order_number", orderNumber)
          .in("payment_status", ["pending", "failed"])
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
