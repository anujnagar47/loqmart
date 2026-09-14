import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import Razorpay from "razorpay"

// POST /api/checkout - Create order from cart
export async function POST(request: Request) {
  try {
    const sessionClient = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = createServiceClient()

    const body = await request.json()
    const { items, address_id, payment_method = "razorpay", promo_code, loqcoins_to_redeem } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }
    if (!address_id) {
      return NextResponse.json({ error: "Delivery address required" }, { status: 400 })
    }

    // The address must belong to the person placing the order — never trust
    // an address_id from the client without checking who owns it.
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", address_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (addressError || !address) {
      return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 })
    }

    // Validate all products exist and have stock
    const productIds = items.map((i: { product_id: string }) => i.product_id)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, price, stock, sold_count, seller_id, name")
      .in("id", productIds)
      .eq("approval_status", "approved")

    if (productsError || !products || products.length !== items.length) {
      return NextResponse.json({ error: "One or more products unavailable" }, { status: 400 })
    }

    // Variant-bearing line items are priced and stock-checked against their
    // specific variant row, never the parent product's aggregate stock.
    const variantIds = items
      .map((i: { variant_id?: string }) => i.variant_id)
      .filter((id: string | undefined): id is string => !!id)
    const { data: variants } = variantIds.length
      ? await supabase.from("product_variants").select("id, product_id, name, price, stock").in("id", variantIds)
      : { data: [] as { id: string; product_id: string; name: string; price: number | null; stock: number }[] }

    // Check stock
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)
      if (!product) {
        return NextResponse.json({ error: `Product unavailable: ${item.product_id}` }, { status: 400 })
      }
      if (item.variant_id) {
        const variant = variants?.find(v => v.id === item.variant_id && v.product_id === item.product_id)
        if (!variant || variant.stock < item.quantity) {
          return NextResponse.json({ error: `Insufficient stock for: ${product.name}${variant ? ` (${variant.name})` : ""}` }, { status: 400 })
        }
      } else if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for: ${product.name}` }, { status: 400 })
      }
    }

    // Calculate totals
    let subtotal = 0
    const orderItemsData: Array<{
      product_id: string
      seller_id: string
      quantity: number
      price: number
      total: number
      coins_earned: number
      variant_id: string | null
      variant_name: string | null
    }> = []

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)!
      const variant = item.variant_id ? variants?.find(v => v.id === item.variant_id) : null
      const unitPrice = variant?.price ?? product.price
      const itemTotal = unitPrice * item.quantity
      subtotal += itemTotal
      orderItemsData.push({
        product_id: item.product_id,
        seller_id: product.seller_id,
        quantity: item.quantity,
        price: unitPrice,
        total: itemTotal,
        coins_earned: Math.floor(itemTotal / 100),
        variant_id: variant?.id ?? null,
        variant_name: variant?.name ?? null,
      })
    }

    // Re-validate and apply the promo code server-side — never trust a
    // client-supplied discount_amount, and never trust that the code is
    // still valid by the time "Place Order" is clicked.
    let discount = 0
    let appliedPromoCode: string | null = null
    let freeDelivery = false
    if (promo_code && typeof promo_code === "string") {
      const { data: promo } = await supabase
        .from("survey_discount_codes")
        .select("id, code, discount_percent, free_delivery, free_order, is_used, expires_at")
        .ilike("code", promo_code.trim())
        .maybeSingle()

      if (!promo || promo.is_used || (promo.expires_at && new Date(promo.expires_at) < new Date())) {
        return NextResponse.json({ error: "Promo code is no longer valid" }, { status: 400 })
      }

      appliedPromoCode = promo.code
      discount = promo.free_order
        ? subtotal
        : promo.discount_percent
          ? Math.round(subtotal * (promo.discount_percent / 100))
          : 0
      freeDelivery = !!(promo.free_delivery || promo.free_order)
    }

    const afterDiscount = subtotal - discount
    const shipping = freeDelivery || afterDiscount > 999 ? 0 : 49
    const tax = Math.round(afterDiscount * 0.02) // 2% GST (included in total)
    const preCoinsTotal = afterDiscount + shipping + tax

    // LoqCoin redemption — 1 coin = ₹1, capped at the caller's real wallet
    // balance and at 50% of the order value so a wallet can't fully zero out
    // a large order on its own (mirrors how the promo-code discount is
    // similarly recomputed server-side rather than trusted from the client).
    const MAX_REDEEM_FRACTION = 0.5
    let coinsUsed = 0
    if (loqcoins_to_redeem && Number(loqcoins_to_redeem) > 0) {
      const { data: balanceRow } = await supabase
        .from("loqcoin_balances")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle()

      const availableBalance = balanceRow?.balance || 0
      const maxRedeemable = Math.floor(preCoinsTotal * MAX_REDEEM_FRACTION)
      coinsUsed = Math.max(0, Math.min(Math.floor(Number(loqcoins_to_redeem)), availableBalance, maxRedeemable))
    }
    const coinsDiscount = coinsUsed // ₹1 per coin
    const total = Math.max(0, preCoinsTotal - coinsDiscount)

    // Generate order number
    const orderNumber = `LM${Date.now()}`

    // Get seller_id (for now use first item's seller - multi-seller orders handled later)
    const sellerId = orderItemsData[0].seller_id

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        seller_id: sellerId,
        address_id,
        order_number: orderNumber,
        subtotal,
        shipping_cost: shipping,
        tax,
        total,
        discount_amount: discount,
        coupon_code: appliedPromoCode,
        coins_used: coinsUsed,
        coins_discount: coinsDiscount,
        order_status: "pending",
        payment_status: "pending",
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error("Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Insert order items
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData.map(item => ({ ...item, order_id: order.id })))

    if (itemsError) {
      console.error("Order items error:", itemsError)
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    // Deduct stock with optimistic concurrency: .gte("stock", quantity) prevents overselling.
    // Variant-bearing items deduct from the variant's own stock, not the
    // product's aggregate stock — product.sold_count still increments either
    // way so Best Sellers ranking works the same for variant products.
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)!
      if (item.variant_id) {
        const variant = variants?.find(v => v.id === item.variant_id)
        if (!variant) continue // already validated above; unreachable in practice
        await supabase
          .from("product_variants")
          .update({ stock: variant.stock - item.quantity })
          .eq("id", item.variant_id)
          .gte("stock", item.quantity)
        await supabase
          .from("products")
          .update({ sold_count: (product.sold_count || 0) + item.quantity })
          .eq("id", item.product_id)
      } else {
        await supabase
          .from("products")
          .update({
            stock: product.stock - item.quantity,
            sold_count: (product.sold_count || 0) + item.quantity,
          })
          .eq("id", item.product_id)
          .gte("stock", item.quantity)
      }
    }

    // Redeeming LoqCoins spends the buyer's own balance immediately for Cash
    // on Delivery, since there is no later payment webhook to defer to. For
    // Razorpay orders the deduction happens in the webhook on payment.captured
    // (mirrors how coin *earning* and promo-code redemption already work) so
    // an abandoned/failed payment never actually spends the wallet.
    if (coinsUsed > 0 && payment_method !== "razorpay") {
      const { data: balanceRow } = await supabase
        .from("loqcoin_balances")
        .select("balance, lifetime_redeemed")
        .eq("user_id", user.id)
        .maybeSingle()
      if (balanceRow) {
        const newBalance = balanceRow.balance - coinsUsed
        await supabase.from("loqcoin_balances").update({
          balance: newBalance,
          lifetime_redeemed: (balanceRow.lifetime_redeemed || 0) + coinsUsed,
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id)
        await supabase.from("loqcoin_ledger").insert({
          user_id: user.id,
          transaction_type: "redeem",
          amount: -coinsUsed,
          balance_after: newBalance,
          source: "checkout",
          reference_id: order.id,
          reference_type: "order",
          description: `LoqCoins redeemed on Order #${orderNumber}`,
        })
      }
    }

    // Create Razorpay order for online payment
    let razorpayOrderId: string | null = null
    if (payment_method === "razorpay" && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        })
        const rzpOrder = await razorpay.orders.create({
          amount: total * 100, // paise
          currency: "INR",
          receipt: orderNumber,
          notes: { order_id: order.id, user_id: user.id },
        })
        razorpayOrderId = rzpOrder.id
        await supabase.from("orders").update({ razorpay_order_id: razorpayOrderId }).eq("id", order.id)
      } catch (rzpErr) {
        console.error("Razorpay order creation failed:", rzpErr)
        // Non-fatal: frontend will handle missing razorpay_order_id
      }
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: orderNumber,
      total,
      subtotal,
      tax,
      shipping,
      discount,
      promo_code: appliedPromoCode,
      coins_used: coinsUsed,
      coins_discount: coinsDiscount,
      coins_to_earn: Math.floor(afterDiscount / 100),
      payment_method,
      razorpay_order_id: razorpayOrderId,
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
