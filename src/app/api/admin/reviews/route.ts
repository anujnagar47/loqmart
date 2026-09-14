import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const url = new URL(req.url)
  const filter = url.searchParams.get("filter") || "all"
  let query = auth.db.from("reviews")
    .select("*,products(name,seller_id),users(email,full_name)")
    .order("created_at", { ascending: false })
    .limit(200)
  if (filter === "flagged")   query = query.eq("is_flagged", true)
  if (filter === "hidden")    query = query.eq("is_hidden", true)
  const { data, error } = await query
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ reviews: data || [] })
}
