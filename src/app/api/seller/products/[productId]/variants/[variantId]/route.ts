import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

async function getOwnedVariant(supabase: ReturnType<typeof createServiceClient>, userId: string, productId: string, variantId: string) {
  const { data: seller } = await supabase.from("sellers").select("id, approval_status").eq("user_id", userId).single()
  if (!seller || seller.approval_status !== "approved") return null
  const { data: product } = await supabase.from("products").select("id").eq("id", productId).eq("seller_id", seller.id).single()
  if (!product) return null
  const { data: variant } = await supabase.from("product_variants").select("id").eq("id", variantId).eq("product_id", productId).single()
  return variant ? true : null
}

// PUT /api/seller/products/[productId]/variants/[variantId] — update a variant
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ productId: string; variantId: string }> }
) {
  try {
    const { productId, variantId } = await params
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const supabase = createServiceClient()
    const owned = await getOwnedVariant(supabase, user.id, productId, variantId)
    if (!owned) return NextResponse.json({ error: "Variant not found" }, { status: 404 })

    const body = await request.json()
    const { name, sku, price, mrp, stock, image_url, is_default, sort_order } = body

    if (stock !== undefined && Number(stock) < 0) {
      return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 })
    }
    if (price !== undefined && price !== null && Number(price) <= 0) {
      return NextResponse.json({ error: "Price must be positive" }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined)       updates.name       = String(name).trim().slice(0, 100)
    if (sku !== undefined)        updates.sku        = sku ? String(sku).trim().slice(0, 100) : null
    if (price !== undefined)      updates.price      = price != null ? Math.round(Number(price)) : null
    if (mrp !== undefined)        updates.mrp        = mrp != null ? Math.round(Number(mrp)) : null
    if (stock !== undefined)      updates.stock      = Math.round(Number(stock))
    if (image_url !== undefined)  updates.image_url  = image_url || null
    if (is_default !== undefined) updates.is_default = !!is_default
    if (sort_order !== undefined) updates.sort_order = Number(sort_order)

    const { data: variant, error } = await supabase
      .from("product_variants").update(updates).eq("id", variantId).select().single()

    if (error || !variant) return NextResponse.json({ error: "Failed to update variant" }, { status: 500 })
    return NextResponse.json({ success: true, variant })
  } catch (error) {
    console.error("Seller variant update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/seller/products/[productId]/variants/[variantId]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string; variantId: string }> }
) {
  try {
    const { productId, variantId } = await params
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const supabase = createServiceClient()
    const owned = await getOwnedVariant(supabase, user.id, productId, variantId)
    if (!owned) return NextResponse.json({ error: "Variant not found" }, { status: 404 })

    const { error } = await supabase.from("product_variants").delete().eq("id", variantId)
    if (error) return NextResponse.json({ error: "Failed to delete variant" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Seller variant delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
