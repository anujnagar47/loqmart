import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ penaltyId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { penaltyId } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  for (const f of ["status", "resolution_notes"]) {
    if (f in body) allowed[f] = body[f]
  }
  if (body.status !== "active") {
    allowed.resolved_by = auth.userId
    allowed.resolved_at = new Date().toISOString()
  }
  const { error } = await auth.db.from("penalties").update(allowed).eq("id", penaltyId)
  if (error) { console.error("Admin API error:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) }
  try { await auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "penalty.update", target_type: "penalty", target_id: penaltyId, new_value: allowed,
  }) } catch { /* non-critical audit log */ }
  return NextResponse.json({ ok: true })
}
