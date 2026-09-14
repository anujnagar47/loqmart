import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

const CART_SELECT = "*, product:products(*, sellers(id, business_name, swadeshi_rank, state_code)), variant:product_variants(*)"

async function requireUser() {
  const sessionClient = await createClient()
  const { data: { user }, error } = await sessionClient.auth.getUser()
  if (error || !user) return null
  return user
}

// GET /api/cart — the authenticated user's persisted cart, joined with live product/variant data
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cart_items")
    .select(CART_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: "Failed to load cart" }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}

// POST /api/cart — add a quantity to a line (increments if it already exists)
export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const body = await request.json()
  const productId = body.product_id as string | undefined
  const variantId = (body.variant_id as string | undefined) || null
  const quantity = Math.max(1, Number(body.quantity) || 1)
  if (!productId) return NextResponse.json({ error: "product_id is required" }, { status: 400 })

  const supabase = createServiceClient()

  let existingQuery = supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", productId)
  existingQuery = variantId ? existingQuery.eq("variant_id", variantId) : existingQuery.is("variant_id", null)
  const { data: existing } = await existingQuery.maybeSingle()

  if (existing) {
    await supabase.from("cart_items").update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() }).eq("id", existing.id)
  } else {
    await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, variant_id: variantId, quantity })
  }

  const { data, error } = await supabase.from("cart_items").select(CART_SELECT).eq("user_id", user.id).order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: "Failed to update cart" }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}

// PUT /api/cart — set a line's quantity to an absolute value (0 or less removes it)
export async function PUT(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const body = await request.json()
  const productId = body.product_id as string | undefined
  const variantId = (body.variant_id as string | undefined) || null
  const quantity = Number(body.quantity)
  if (!productId) return NextResponse.json({ error: "product_id is required" }, { status: 400 })

  const supabase = createServiceClient()

  if (quantity <= 0) {
    let delQuery = supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId)
    delQuery = variantId ? delQuery.eq("variant_id", variantId) : delQuery.is("variant_id", null)
    await delQuery
  } else {
    let updQuery = supabase.from("cart_items").update({ quantity, updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("product_id", productId)
    updQuery = variantId ? updQuery.eq("variant_id", variantId) : updQuery.is("variant_id", null)
    await updQuery
  }

  const { data, error } = await supabase.from("cart_items").select(CART_SELECT).eq("user_id", user.id).order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: "Failed to update cart" }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}

// DELETE /api/cart — remove one line (product_id [+ variant_id]) or, with ?all=1, clear the whole cart
export async function DELETE(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const supabase = createServiceClient()
  const url = new URL(request.url)

  if (url.searchParams.get("all") === "1") {
    await supabase.from("cart_items").delete().eq("user_id", user.id)
    return NextResponse.json({ items: [] })
  }

  const body = await request.json().catch(() => ({}))
  const productId = body.product_id as string | undefined
  const variantId = (body.variant_id as string | undefined) || null
  if (!productId) return NextResponse.json({ error: "product_id is required" }, { status: 400 })

  let delQuery = supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId)
  delQuery = variantId ? delQuery.eq("variant_id", variantId) : delQuery.is("variant_id", null)
  await delQuery

  const { data, error } = await supabase.from("cart_items").select(CART_SELECT).eq("user_id", user.id).order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: "Failed to update cart" }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}
