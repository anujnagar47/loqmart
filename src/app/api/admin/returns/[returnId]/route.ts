import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ returnId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { returnId } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  for (const f of ["status", "resolution_notes", "refund_amount", "refund_processed", "assigned_to"]) {
    if (f in body) allowed[f] = body[f]
  }
  if (body.status && ["resolved_buyer","resolved_seller","closed"].includes(body.status)) {
    allowed.resolved_by = auth.userId
    allowed.resolved_at = new Date().toISOString()
  }
  allowed.updated_at = new Date().toISOString()
  const { error } = await auth.db.from("return_requests").update(allowed).eq("id", returnId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  try { await auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "return.update", target_type: "return_request", target_id: returnId, new_value: allowed,
  }) } catch { /* non-critical audit log */ }
  return NextResponse.json({ ok: true })
}
