import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const url    = new URL(req.url)
  const status = url.searchParams.get("status") || "all"
  const scoped = auth.role === "sub_admin" && auth.stateScope
  const sellerSelect = scoped ? "sellers!inner(business_name,state,state_code)" : "sellers(business_name,state)"

  let query = auth.db.from("penalties")
    .select(`*,${sellerSelect},users!penalties_issued_by_fkey(full_name)`)
    .order("created_at", { ascending: false })
  if (status !== "all") query = query.eq("status", status)
  if (scoped) query = query.eq("sellers.state_code", auth.stateScope)
  const { data, error } = await query
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  return NextResponse.json({ penalties: data || [] })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const body = await req.json()
  const { seller_id, type, reason, amount_held, trust_score_impact, related_order_id } = body
  if (!seller_id || !type || !reason) return NextResponse.json({ error: "seller_id, type, reason required" }, { status: 400 })

  const { data, error } = await auth.db.from("penalties").insert({
    seller_id, type, reason,
    amount_held: amount_held || 0,
    trust_score_impact: trust_score_impact || 0,
    related_order_id: related_order_id || null,
    status: "active",
    issued_by: auth.userId,
  }).select().single()
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }

  if (trust_score_impact) {
    const { data: sellerRow } = await auth.db.from("sellers").select("swadeshi_score").eq("id", seller_id).single()
    if (sellerRow) {
      const newScore = Math.max(0, (sellerRow.swadeshi_score || 0) - Math.abs(trust_score_impact))
      try { await auth.db.from("sellers").update({ swadeshi_score: newScore }).eq("id", seller_id) } catch { /* non-critical */ }
    }
  }

  try { await auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "penalty.issue", target_type: "seller", target_id: seller_id,
    new_value: { type, reason, amount_held },
  }) } catch { /* non-critical audit log */ }

  return NextResponse.json({ penalty: data }, { status: 201 })
}
