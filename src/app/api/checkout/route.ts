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
    const { items, address_id, payment_method = "razorpay" } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }
    if (!address_id) {
      return NextResponse.json({ error: "Delivery address required" }, { status: 400 })
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

    // Check stock
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)
      if (!product || product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for: ${product?.name || item.product_id}` }, { status: 400 })
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
    }> = []

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)!
      const itemTotal = product.price * item.quantity
      subtotal += itemTotal
      orderItemsData.push({
        product_id: item.product_id,
        seller_id: product.seller_id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
        coins_earned: Math.floor(itemTotal / 100),
      })
    }

    const shipping = subtotal > 999 ? 0 : 49
    const tax = Math.round(subtotal * 0.02) // 2% GST (included in total)
    const total = subtotal + shipping + tax

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

    // Deduct stock with optimistic concurrency: .gte("stock", quantity) prevents overselling
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)!
      await supabase
        .from("products")
        .update({
          stock: product.stock - item.quantity,
          sold_count: (product.sold_count || 0) + item.quantity,
        })
        .eq("id", item.product_id)
        .gte("stock", item.quantity)
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
      coins_to_earn: Math.floor(subtotal / 100),
      payment_method,
      razorpay_order_id: razorpayOrderId,
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
