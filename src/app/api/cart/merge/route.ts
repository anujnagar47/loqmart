import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

const CART_SELECT = "*, product:products(*, sellers(id, business_name, swadeshi_rank, state_code)), variant:product_variants(*)"

interface MergeItem {
  product_id: string
  variant_id?: string | null
  quantity: number
}

// POST /api/cart/merge — fold a guest (localStorage) cart into the signed-in
// user's persisted cart on login. Existing server-side lines get their
// quantity incremented by the guest line's quantity; new lines are inserted.
// Returns the full authoritative merged cart so the client can replace its
// local state wholesale rather than trying to reconcile the two itself.
export async function POST(request: Request) {
  const sessionClient = await createClient()
  const { data: { user }, error: authError } = await sessionClient.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const body = await request.json()
  const items: MergeItem[] = Array.isArray(body.items) ? body.items : []

  const supabase = createServiceClient()

  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity < 1) continue
    const variantId = item.variant_id || null

    let existingQuery = supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", item.product_id)
    existingQuery = variantId ? existingQuery.eq("variant_id", variantId) : existingQuery.is("variant_id", null)
    const { data: existing } = await existingQuery.maybeSingle()

    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + item.quantity, updated_at: new Date().toISOString() }).eq("id", existing.id)
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: item.product_id, variant_id: variantId, quantity: item.quantity })
    }
  }

  const { data, error } = await supabase.from("cart_items").select(CART_SELECT).eq("user_id", user.id).order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: "Failed to merge cart" }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}
