import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const db = auth.db

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  let query = db
    .from("products")
    .select("id, name, price, mode, state_code, approval_status, is_featured, created_at, seller_id")
    .order("created_at", { ascending: false })
    .limit(300)

  if (status && status !== "all") query = query.eq("approval_status", status)
  if (auth.role === "sub_admin" && auth.stateScope) query = query.eq("state_code", auth.stateScope)

  const { data, error } = await query
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ products: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const db = auth.db

  const body = await req.json()
  const { name, description, price, mrp, stock, mode, state_code, seller_id, category_id, images } = body

  if (!name || !price || !mode || !seller_id) {
    return NextResponse.json({ error: "name, price, mode, seller_id are required" }, { status: 400 })
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now()

  const { data, error } = await db
    .from("products")
    .insert({
      name, slug, description, price, mrp, stock: stock ?? 0,
      mode, state_code, seller_id, category_id,
      images: images || [],
      approval_status: "approved",
      is_featured: false,
      approved_at: new Date().toISOString(),
      approved_by: auth.userId,
    })
    .select()
    .single()

  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ product: data }, { status: 201 })
}
