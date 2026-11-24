import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIp, isDistributedRateLimitConfigured } from "@/lib/rate-limit"

type CartLine = { product_id: string; variant_id: string | null; quantity: number }

function normalizePhone(value: string) {
  let digits = value.trim().replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2)
  return digits
}

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    if (process.env.NODE_ENV === "production" && !isDistributedRateLimitConfigured()) return NextResponse.json({ error: "Reservation service requires shared rate-limit configuration." }, { status: 503 })

    const ip = getClientIp(request)
    const allowed = await Promise.all([
      checkRateLimit(`intent:user:${user.id}`, 8, 10 * 60 * 1000),
      checkRateLimit(`intent:network:${ip}`, 30, 10 * 60 * 1000),
    ])
    if (allowed.some(value => !value)) return NextResponse.json({ error: "Too many reservation attempts. Please wait and try again." }, { status: 429 })

    const idempotencyKey = request.headers.get("Idempotency-Key") || ""
    if (idempotencyKey.length < 8 || idempotencyKey.length > 120) {
      return NextResponse.json({ error: "A valid Idempotency-Key header is required." }, { status: 400 })
    }
    const contentLength = Number(request.headers.get("content-length") || 0)
    if (contentLength > 64_000) return NextResponse.json({ error: "Reservation request is too large." }, { status: 413 })

    const body = await request.json()
    const addressId = typeof body.address_id === "string" ? body.address_id : ""
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
      return NextResponse.json({ error: "Add between 1 and 100 cart lines to reserve." }, { status: 400 })
    }

    const merged = new Map<string, CartLine>()
    for (const raw of body.items as unknown[]) {
      if (!raw || typeof raw !== "object") return NextResponse.json({ error: "Cart contains an invalid line." }, { status: 400 })
      const line = raw as Record<string, unknown>
      if (typeof line.product_id !== "string" || !line.product_id.trim() ||
          !(line.variant_id == null || typeof line.variant_id === "string") ||
          typeof line.quantity !== "number" || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 999) {
        return NextResponse.json({ error: "Cart contains an invalid product, variant, or quantity." }, { status: 400 })
      }
      const variantId = typeof line.variant_id === "string" && line.variant_id ? line.variant_id : null
      const key = `${line.product_id}:${variantId || ""}`
      const current = merged.get(key)
      const quantity = (current?.quantity || 0) + line.quantity
      if (quantity > 999) return NextResponse.json({ error: "A product quantity cannot exceed 999." }, { status: 400 })
      merged.set(key, { product_id: line.product_id, variant_id: variantId, quantity })
    }
    const items = [...merged.values()]
    if (!addressId) return NextResponse.json({ error: "Delivery address is required." }, { status: 400 })

    const db = createServiceClient()
    const { data: profile } = await db.from("users").select("role").eq("id", user.id).maybeSingle()
    if (!profile || !["buyer", "seller"].includes(profile.role)) return NextResponse.json({ error: "This account cannot reserve customer orders." }, { status: 403 })

    const { data: address, error: addressError } = await db.from("addresses")
      .select("id, name, phone, address_line1, address_line2, city, state, state_code, pincode")
      .eq("id", addressId).eq("user_id", user.id).maybeSingle()
    if (addressError || !address) return NextResponse.json({ error: "Select a valid delivery address." }, { status: 400 })
    if (!/^[6-9]\d{9}$/.test(normalizePhone(address.phone || ""))) return NextResponse.json({ error: "Delivery address phone must be a valid 10-digit Indian mobile number." }, { status: 400 })
    if (!/^\d{6}$/.test(String(address.pincode || "").trim())) return NextResponse.json({ error: "Delivery address pincode must contain exactly 6 digits." }, { status: 400 })

    const productIds = [...new Set(items.map(item => item.product_id))]
    const { data: products, error: productError } = await db.from("products")
      .select("id, price, stock, seller_id, name").in("id", productIds).eq("approval_status", "approved")
    if (productError || !products || products.length !== productIds.length) return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 })

    const variantIds = [...new Set(items.map(item => item.variant_id).filter((value): value is string => !!value))]
    const { data: variants, error: variantError } = variantIds.length
      ? await db.from("product_variants").select("id, product_id, name, price, stock").in("id", variantIds)
      : { data: [], error: null }
    if (variantError) return NextResponse.json({ error: "Could not validate product options." }, { status: 503 })

    const grouped = new Map<string, { seller_id: string; items: Array<Record<string, unknown>>; subtotal: number }>()
    for (const item of items) {
      const product = products.find(row => row.id === item.product_id)
      if (!product) return NextResponse.json({ error: "A product in this cart is unavailable." }, { status: 400 })
      const variant = item.variant_id ? variants?.find(row => row.id === item.variant_id && row.product_id === item.product_id) : null
      if (item.variant_id && !variant) return NextResponse.json({ error: `Selected option is unavailable for ${product.name}.` }, { status: 400 })
      const price = variant?.price ?? product.price
      if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: `Price is invalid for ${product.name}.` }, { status: 409 })
      // This is an early user-friendly check only. The SQL RPC below is the sole stock decrement and repeats the check atomically.
      if ((variant ? variant.stock : product.stock) < item.quantity) return NextResponse.json({ error: `Insufficient stock for ${product.name}${variant ? ` (${variant.name})` : ""}.` }, { status: 409 })
      const group = grouped.get(product.seller_id) || { seller_id: String(product.seller_id), items: [] as Array<Record<string, unknown>>, subtotal: 0 }
      const total = Number(price) * item.quantity
      group.subtotal += total
      group.items.push({ product_id: item.product_id, seller_id: product.seller_id, quantity: item.quantity, price, total, coins_earned: 0, variant_id: variant?.id || null, variant_name: variant?.name || null })
      grouped.set(product.seller_id, group)
    }

    const addressSnapshot = {
      name: address.name,
      phone: normalizePhone(address.phone),
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      state_code: address.state_code,
      pincode: String(address.pincode).trim(),
      country: "India",
    }
    const orders = [...grouped.values()].sort((a, b) => a.seller_id.localeCompare(b.seller_id)).map(group => {
      const shipping = group.subtotal > 999 ? 0 : 49
      const orderNumber = `LM${Date.now()}${randomBytes(3).toString("hex").toUpperCase()}`
      return {
        seller_id: group.seller_id,
        order_number: orderNumber,
        subtotal: group.subtotal,
        shipping_cost: shipping,
        tax: 0,
        total: group.subtotal + shipping,
        shipping_address: addressSnapshot,
        items: group.items,
      }
    })

    const { data: result, error: reservationError } = await db.rpc("create_intent_reservations", {
      p_user_id: user.id,
      p_address_id: addressId,
      p_idempotency_key: idempotencyKey,
      p_orders: orders,
    })
    if (reservationError) {
      console.error("Intent reservation RPC failed:", reservationError)
      const insufficient = reservationError.message.includes("INSUFFICIENT_STOCK")
      return NextResponse.json({ error: insufficient ? "Stock changed during checkout. Refresh your cart and try again." : "Reservation service is not ready. Apply the intent-capture SQL migration and retry." }, { status: insufficient ? 409 : 503 })
    }

    return NextResponse.json({ order_ids: result?.order_ids || [], order_numbers: result?.order_numbers || [], reservation_status: "pending_confirmation", no_payment_required: true })
  } catch (error) {
    console.error("Checkout intent error:", error)
    return NextResponse.json({ error: "Could not reserve your order. Please retry." }, { status: 500 })
  }
}
