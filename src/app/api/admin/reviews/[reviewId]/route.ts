import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { reviewId } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  for (const f of ["is_flagged", "flag_reason", "is_hidden"]) {
    if (f in body) allowed[f] = body[f]
  }
  const { error } = await auth.db.from("reviews").update(allowed).eq("id", reviewId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response
  const { reviewId } = await params
  const { error } = await auth.db.from("reviews").delete().eq("id", reviewId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  try { await auth.db.from("admin_logs").insert({
    admin_id: auth.userId, action: "review.delete", target_type: "review", target_id: reviewId,
  }) } catch { /* non-critical audit log */ }
  return NextResponse.json({ ok: true })
}
