import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const url    = new URL(req.url)
  const status = url.searchParams.get("status") || "all"

  let query = auth.db
    .from("return_requests")
    .select("*,orders(order_number,total),sellers(business_name,state),users(email,full_name)")
    .order("created_at", { ascending: false })
  if (status !== "all") query = query.eq("status", status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ returns: data || [] })
}
