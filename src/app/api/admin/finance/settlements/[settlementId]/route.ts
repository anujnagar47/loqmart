import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ settlementId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { settlementId } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  for (const f of ["status", "hold_reason", "bank_reference", "penalty_deduction", "net_payable", "notes"]) {
    if (f in body) allowed[f] = body[f]
  }
  if (body.status === "paid") allowed.paid_at = new Date().toISOString()
  allowed.processed_by = auth.userId
  allowed.updated_at = new Date().toISOString()
  const { error } = await auth.db.from("settlements").update(allowed).eq("id", settlementId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try { await auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "settlement.update", target_type: "settlement", target_id: settlementId, new_value: allowed,
  }) } catch { /* non-critical audit log */ }

  return NextResponse.json({ ok: true })
}
