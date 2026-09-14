import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { data, error } = await auth.db
    .from("categories")
    .select("id, name, slug, description, image_url, icon, mode, sort_order, is_active, product_count, created_at")
    .order("sort_order", { ascending: true })
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ categories: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const body = await req.json()
  const { name, slug, description, image_url, icon, mode, sort_order } = body
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 })
  const { data, error } = await auth.db
    .from("categories")
    .insert({ name, slug, description, image_url, icon, mode: mode || null, sort_order: sort_order ?? 99, is_active: true })
    .select()
    .single()
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ category: data }, { status: 201 })
}
