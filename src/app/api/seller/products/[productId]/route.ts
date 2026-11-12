import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

async function getApprovedSeller(supabase: ReturnType<typeof createServiceClient>, userId: string) {
  const { data } = await supabase
    .from("sellers")
    .select("id, approval_status")
    .eq("user_id", userId)
    .single()
  return data?.approval_status === "approved" ? data : null
}

// PUT /api/seller/products/[productId] — update a product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const supabase = createServiceClient()
    const seller = await getApprovedSeller(supabase, user.id)
    if (!seller) return NextResponse.json({ error: "Approved seller account required" }, { status: 403 })

    // Confirm product belongs to this seller
    const { data: existing } = await supabase
      .from("products").select("id, approval_status, tags").eq("id", productId).eq("seller_id", seller.id).single()
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    const body = await request.json()
    const { name, description, category_id, price, mrp, stock, unit, mode, state_code, images, tags, specifications } = body

    if (price !== undefined && price <= 0) {
      return NextResponse.json({ error: "Price must be positive" }, { status: 400 })
    }
    if (mrp !== undefined && price !== undefined && mrp < price) {
      return NextResponse.json({ error: "MRP cannot be less than price" }, { status: 400 })
    }
    if (stock !== undefined && stock < 0) {
      return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 })
    }
    if (mode !== undefined && !["handmade", "machine_made"].includes(mode)) {
      return NextResponse.json({ error: "Mode must be handmade or machine_made" }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (name !== undefined)           updates.name           = name
    if (description !== undefined)    updates.description    = description
    if (category_id !== undefined)    updates.category_id    = category_id || null
    if (price !== undefined)          updates.price          = Math.round(price)
    if (mrp !== undefined)            updates.mrp            = mrp ? Math.round(mrp) : null
    if (stock !== undefined)          updates.stock          = Math.round(stock)
    if (unit !== undefined)           updates.unit           = unit
    if (mode !== undefined)           updates.mode           = mode
    if (state_code !== undefined)     updates.state_code     = state_code
    if (images !== undefined)         updates.images         = images
    if (tags !== undefined) {
      const verifiedMarks = (existing.tags || []).filter((tag: string) => ["gi-certified", "handloom-certified"].includes(tag.trim().toLowerCase()))
      const sellerTags = Array.isArray(tags)
        ? tags.filter((tag: unknown) => !["gi-certified", "handloom-certified"].includes(String(tag).trim().toLowerCase()))
        : []
      updates.tags = [...sellerTags, ...verifiedMarks]
    }
    if (specifications !== undefined) updates.specifications = specifications
    updates.updated_at = new Date().toISOString()

    // Edits on approved products set them back to pending re-review
    const coreFieldChanged = "name" in body || "description" in body || "price" in body || "images" in body
    if (existing.approval_status === "approved" && coreFieldChanged) {
      updates.approval_status = "pending"
    }

    const { data: product, error } = await supabase
      .from("products").update(updates).eq("id", productId).select().single()

    if (error) return NextResponse.json({ error: "Failed to update product" }, { status: 500 })

    return NextResponse.json({ success: true, product, resubmitted: updates.approval_status === "pending" })
  } catch (error) {
    console.error("Seller product update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/seller/products/[productId] — remove a product (only if not in active orders)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const supabase = createServiceClient()
    const seller = await getApprovedSeller(supabase, user.id)
    if (!seller) return NextResponse.json({ error: "Approved seller account required" }, { status: 403 })

    const { data: existing } = await supabase
      .from("products").select("id, name").eq("id", productId).eq("seller_id", seller.id).single()
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    // Block deletion if product has active (non-cancelled) orders
    const { data: activeOrders } = await supabase
      .from("order_items")
      .select("id, orders!inner(order_status)")
      .eq("product_id", productId)
      .not("orders.order_status", "in", '("cancelled","delivered")')
      .limit(1)

    if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json({ error: "Cannot delete product with active orders" }, { status: 409 })
    }

    const { error } = await supabase.from("products").delete().eq("id", productId)
    if (error) return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Seller product delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
