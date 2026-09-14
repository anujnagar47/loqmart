import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

async function getOwnedProduct(supabase: ReturnType<typeof createServiceClient>, userId: string, productId: string) {
  const { data: seller } = await supabase.from("sellers").select("id, approval_status").eq("user_id", userId).single()
  if (!seller || seller.approval_status !== "approved") return null
  const { data: product } = await supabase.from("products").select("id").eq("id", productId).eq("seller_id", seller.id).single()
  return product ? { seller } : null
}

// GET /api/seller/products/[productId]/variants — list a seller's own product's variants
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const supabase = createServiceClient()
    const owned = await getOwnedProduct(supabase, user.id, productId)
    if (!owned) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (error) return NextResponse.json({ error: "Failed to load variants" }, { status: 500 })
    return NextResponse.json({ variants: variants || [] })
  } catch (error) {
    console.error("Seller variants list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/seller/products/[productId]/variants — add a variant
export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const supabase = createServiceClient()
    const owned = await getOwnedProduct(supabase, user.id, productId)
    if (!owned) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    const body = await request.json()
    const { name, sku, price, mrp, stock, image_url, is_default, sort_order } = body

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Variant name is required" }, { status: 400 })
    }
    if (stock === undefined || Number(stock) < 0) {
      return NextResponse.json({ error: "Stock must be zero or greater" }, { status: 400 })
    }
    if (price !== undefined && price !== null && Number(price) <= 0) {
      return NextResponse.json({ error: "Price must be positive" }, { status: 400 })
    }

    const { data: variant, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        name: String(name).trim().slice(0, 100),
        sku: sku ? String(sku).trim().slice(0, 100) : null,
        price: price != null ? Math.round(Number(price)) : null,
        mrp: mrp != null ? Math.round(Number(mrp)) : null,
        stock: Math.round(Number(stock)),
        image_url: image_url || null,
        is_default: !!is_default,
        sort_order: sort_order != null ? Number(sort_order) : 0,
      })
      .select()
      .single()

    if (error || !variant) {
      console.error("Variant insert error:", error)
      return NextResponse.json({ error: "Failed to add variant" }, { status: 500 })
    }

    return NextResponse.json({ success: true, variant }, { status: 201 })
  } catch (error) {
    console.error("Seller variant create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
