import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const [{ data: sellers }, { data: rankHistory }] = await Promise.all([
    auth.db.from("sellers")
      .select("id,business_name,state,state_code,swadeshi_rank,swadeshi_score,trust_score,approval_status,total_orders,return_ratio,created_at")
      .order("swadeshi_rank", { ascending: false })
      .limit(100),
    auth.db.from("swadeshi_rank_history")
      .select("*")
      .order("calculated_at", { ascending: false })
      .limit(200),
  ])

  return NextResponse.json({ sellers: sellers || [], rankHistory: rankHistory || [] })
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { seller_id, swadeshi_rank, swadeshi_score, trust_score, override_reason } = await req.json()
  if (!seller_id) return NextResponse.json({ error: "seller_id required" }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (swadeshi_rank  != null) update.swadeshi_rank  = swadeshi_rank
  if (swadeshi_score != null) update.swadeshi_score = swadeshi_score
  if (trust_score    != null) update.trust_score    = trust_score

  const { error } = await auth.db.from("sellers").update(update).eq("id", seller_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try { await auth.db.from("swadeshi_rank_history").insert({
    seller_id, rank: swadeshi_rank || 0, score: swadeshi_score || 0,
    factors: { override: true, override_reason, override_by: auth.userId },
  }) } catch { /* non-critical */ }

  try { await auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "trust.override", target_type: "seller", target_id: seller_id,
    new_value: { swadeshi_rank, swadeshi_score, trust_score, override_reason },
  }) } catch { /* non-critical audit log */ }

  return NextResponse.json({ ok: true })
}
