import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

// POST /api/seller/products - Add a new product (authenticated seller only)
export async function POST(request: Request) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error: authError } = await sessionClient.auth.getUser()

    const supabase = createServiceClient()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get seller record
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id, approval_status, state_code")
      .eq("user_id", user.id)
      .single()

    if (sellerError || !seller || seller.approval_status !== "approved") {
      return NextResponse.json({ error: "Approved seller account required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category_id,
      price,
      mrp,
      stock,
      unit,
      mode,
      images,
      tags,
      specifications,
      state_code,
    } = body

    // Validate required fields (category_id is optional)
    if (!name || !price || !unit || !mode) {
      return NextResponse.json({ error: "Required fields: name, price, unit, mode" }, { status: 400 })
    }

    if (!["handmade", "machine_made"].includes(mode)) {
      return NextResponse.json({ error: "Mode must be handmade or machine_made" }, { status: 400 })
    }

    if (price <= 0 || (mrp && mrp < price)) {
      return NextResponse.json({ error: "Price must be positive. MRP cannot be less than price." }, { status: 400 })
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      + `-${Date.now().toString(36)}`

    // Create product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        seller_id: seller.id,
        category_id,
        name,
        slug,
        description,
        price: Math.round(price),
        mrp: mrp ? Math.round(mrp) : null,
        stock: Math.round(stock),
        unit,
        mode,
        images: images || [],
        tags: tags || [],
        specifications: specifications || {},
        state_code: state_code || seller.state_code,
        approval_status: "pending", // Requires admin approval before going live
        rating: 0,
        review_count: 0,
        sold_count: 0,
      })
      .select()
      .single()

    if (productError || !product) {
      console.error("Product creation error:", productError)
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
    }

    // Create product approval record
    await supabase.from("product_approvals").insert({
      product_id: product.id,
      seller_id: seller.id,
      status: "pending",
    })

    // Notify admins
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")

    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map(admin => ({
          user_id: admin.id,
          type: "new_product_listing",
          title: "New Product Pending Approval",
          message: `"${name}" by seller ID ${seller.id} is awaiting approval.`,
          data: { product_id: product.id, product_name: name, seller_id: seller.id },
        }))
      )
    }

    return NextResponse.json({
      message: "Product submitted for approval. It will go live once approved by LoqMart admin.",
      product_id: product.id,
      slug: product.slug,
      approval_status: "pending",
    }, { status: 201 })
  } catch (error) {
    console.error("Seller product creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
