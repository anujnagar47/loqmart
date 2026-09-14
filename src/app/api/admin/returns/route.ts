import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const url    = new URL(req.url)
  const status = url.searchParams.get("status") || "all"

  const scoped = auth.role === "sub_admin" && auth.stateScope
  const sellerSelect = scoped ? "sellers!inner(business_name,state,state_code)" : "sellers(business_name,state)"

  let query = auth.db
    .from("return_requests")
    .select(`*,orders(order_number,total),${sellerSelect},users(email,full_name)`)
    .order("created_at", { ascending: false })
  if (status !== "all") query = query.eq("status", status)
  if (scoped) query = query.eq("sellers.state_code", auth.stateScope)
  const { data, error } = await query
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ returns: data || [] })
}
