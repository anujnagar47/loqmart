import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
const eventTypes = new Set(["page_view","product_view","product_click","quick_view","product_engagement","search_click","search_submit","category_view","state_view","seller_view","add_to_cart","wishlist_add","wishlist_remove","customization_inquiry"])
const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

async function identify() {
  const auth = await createClient()
  const { data } = await auth.auth.getUser()
  return data.user?.id || null
}

export async function POST(req: NextRequest) {
  try {
    if (req.cookies.get("loqmart_analytics_consent")?.value !== "accepted") return NextResponse.json({ ok: true })
    const input = await req.json()
    if (!uuid(input.sessionId) || !uuid(input.visitorId) || !eventTypes.has(input.eventType)) return NextResponse.json({ error: "Invalid event" }, { status: 400 })
    const db = createServiceClient()
    const userId = await identify()
    const eventState = input.eventType === "state_view" && typeof input.source === "string" && /^[A-Z]{2}$/.test(input.source) ? input.source : input.stateCode
    const { data: previousSession } = await db.from("visitor_sessions").select("state_code,pincode").eq("session_id", input.sessionId).maybeSingle()
    const session = { session_id: input.sessionId, visitor_id: input.visitorId, user_id: userId, state_code: typeof eventState === "string" ? eventState.slice(0, 5) : previousSession?.state_code || null, pincode: /^\d{6}$/.test(input.pincode || "") ? input.pincode : previousSession?.pincode || null, last_seen_at: new Date().toISOString() }
    const { error: sessionError } = await db.from("visitor_sessions").upsert(session, { onConflict: "session_id" })
    if (sessionError) throw sessionError
    const slug = typeof input.productSlug === "string" ? input.productSlug.slice(0, 220) : null
    const productId = uuid(input.productId) ? input.productId : null
    let product: any = null
    if (slug || productId) {
      const q = db.from("products").select("id,category_id,seller_id,state_code").limit(1)
      const result = slug ? await q.eq("slug", slug).maybeSingle() : await q.eq("id", productId).maybeSingle()
      product = result.data
    }
    let categoryId = product?.category_id || null
    if (!categoryId && input.eventType === "category_view" && typeof input.query === "string") {
      const { data: category } = await db.from("categories").select("id").eq("slug", input.query.slice(0, 220)).maybeSingle()
      categoryId = category?.id || null
    }
    let sellerId = product?.seller_id || null
    if (!sellerId && input.eventType === "seller_view" && uuid(input.sellerId)) {
      const { data: seller } = await db.from("sellers").select("id,state_code").eq("id", input.sellerId).maybeSingle()
      sellerId = seller?.id || null
      if (!session.state_code && seller?.state_code) session.state_code = seller.state_code
    }
    const safeMeta: Record<string, unknown> = {}
    for (const key of ["query", "source", "productSlug", "durationMs", "resultCount", "quantity", "variantId"]) {
      const value = input[key]
      if (typeof value === "string") safeMeta[key] = value.slice(0, 240)
      else if (typeof value === "number" && Number.isFinite(value)) safeMeta[key] = Math.max(0, Math.min(value, 1800000))
    }
    const { error } = await db.from("analytics_events").insert({ visitor_id: input.visitorId, session_id: input.sessionId, user_id: userId, event_type: input.eventType, product_id: product?.id || null, category_id: categoryId, seller_id: sellerId, state_code: product?.state_code || session.state_code, metadata: safeMeta })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    void error
    return NextResponse.json({ ok: true })
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (req.cookies.get("loqmart_analytics_consent")?.value !== "accepted") return NextResponse.json({ ok: true })
    const input = await req.json()
    if (!uuid(input.sessionId) || !uuid(input.visitorId) || !["cart", "wishlist"].includes(input.itemType) || !Array.isArray(input.items) || input.items.length > 100) return NextResponse.json({ error: "Invalid snapshot" }, { status: 400 })
    const userId = await identify()
    if (userId) return NextResponse.json({ ok: true })
    const db = createServiceClient()
    await db.from("visitor_sessions").upsert({ session_id: input.sessionId, visitor_id: input.visitorId, state_code: typeof input.stateCode === "string" ? input.stateCode.slice(0,5) : null, pincode: /^\d{6}$/.test(input.pincode || "") ? input.pincode : null, last_seen_at: new Date().toISOString() }, { onConflict: "session_id" })
    const { data: previous } = await db.from("visitor_intent_items").select("product_id,variant_id,added_at").eq("session_id", input.sessionId).eq("item_type", input.itemType)
    const itemKey = (x: any) => `${x.product_id}:${x.variant_id || ""}`
    const addedAt = new Map((previous || []).map((x: any) => [itemKey(x), x.added_at]))
    const rows = input.items.filter((x: any) => uuid(x.productId)).map((x: any) => ({ session_id: input.sessionId, visitor_id: input.visitorId, user_id: null, item_type: input.itemType, product_id: x.productId, variant_id: uuid(x.variantId) ? x.variantId : null, quantity: input.itemType === "cart" ? Math.max(1, Math.min(Number(x.quantity) || 1, 99)) : 1, added_at: addedAt.get(`${x.productId}:${uuid(x.variantId) ? x.variantId : ""}`) || new Date().toISOString(), updated_at: new Date().toISOString() }))
    const { error: deleteError } = await db.from("visitor_intent_items").delete().eq("session_id", input.sessionId).eq("item_type", input.itemType)
    if (deleteError) throw deleteError
    if (rows.length) { const { error } = await db.from("visitor_intent_items").insert(rows); if (error) throw error }
    return NextResponse.json({ ok: true })
  } catch (error) {
    void error
    return NextResponse.json({ ok: true })
  }
}
